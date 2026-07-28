#!/usr/bin/env node
/**
 * Provision Supabase for Phoenux Case Study Assembler and wire Vercel.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
 *
 * Optional:
 *   SUPABASE_ORG_ID        — defaults to first org
 *   SUPABASE_DB_PASSWORD   — generated if omitted
 *   VERCEL_SCOPE           — defaults to shahrukh-azhars-projects
 *   SITE_URL               — defaults to https://phoenux-case-study-assembler.vercel.app
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/deploy-supabase.mjs
 */

import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API = "https://api.supabase.com/v1";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SITE_URL =
  process.env.SITE_URL || "https://phoenux-case-study-assembler.vercel.app";
const VERCEL_SCOPE = process.env.VERCEL_SCOPE || "shahrukh-azhars-projects";
const PROJECT_NAME = process.env.SUPABASE_PROJECT_NAME || "phoenux-case-study-assembler";
const REGION = process.env.SUPABASE_REGION || "us-east-1";

if (!TOKEN) {
  console.error(`
Missing SUPABASE_ACCESS_TOKEN.

1. Open https://supabase.com/dashboard/account/tokens
2. Generate a token named "phoenux-deploy"
3. Re-run:

   SUPABASE_ACCESS_TOKEN=sbp_... npm run deploy:supabase
`);
  process.exit(1);
}

function headers(json = true) {
  const h = { Authorization: `Bearer ${TOKEN}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function api(method, pathname, body) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: headers(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(
      `${method} ${pathname} → ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
  }
  return data;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function sh(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout.trim();
}

async function ensureOrgId() {
  if (process.env.SUPABASE_ORG_ID) return process.env.SUPABASE_ORG_ID;
  const orgs = await api("GET", "/organizations");
  if (!Array.isArray(orgs) || orgs.length === 0) {
    throw new Error("No Supabase organizations found for this token.");
  }
  console.log(
    `Using org ${orgs[0].name} (${orgs[0].id})${orgs.length > 1 ? " — set SUPABASE_ORG_ID to override" : ""}`,
  );
  return orgs[0].id;
}

async function ensureProject(orgId, dbPass) {
  const projects = await api("GET", "/projects");
  const existing = Array.isArray(projects)
    ? projects.find((p) => p.name === PROJECT_NAME)
    : null;
  if (existing) {
    console.log(`Reusing existing project ${existing.name} (${existing.id})`);
    return existing;
  }

  console.log(`Creating project ${PROJECT_NAME} in ${REGION}…`);
  const created = await api("POST", "/projects", {
    name: PROJECT_NAME,
    organization_id: orgId,
    region: REGION,
    db_pass: dbPass,
    plan: "free",
  });
  return created;
}

async function waitHealthy(ref) {
  console.log("Waiting for project to become healthy…");
  for (let i = 0; i < 60; i += 1) {
    const project = await api("GET", `/projects/${ref}`);
    const status = project.status || project.subscription_id;
    process.stdout.write(`  status=${project.status}\n`);
    if (project.status === "ACTIVE_HEALTHY") return project;
    if (project.status === "INACTIVE" || project.status === "GOING_DOWN") {
      throw new Error(`Project entered bad status: ${project.status}`);
    }
    await sleep(10000);
  }
  throw new Error("Timed out waiting for ACTIVE_HEALTHY");
}

async function runMigrations(ref) {
  const files = [
    "001_initial.sql",
    "002_question_engine.sql",
    "003_facts.sql",
    "004_knowledge.sql",
  ];
  for (const file of files) {
    const sqlPath = path.join(ROOT, "supabase/migrations", file);
    const query = await fs.readFile(sqlPath, "utf8");
    console.log(`Applying ${file}…`);
    await api("POST", `/projects/${ref}/database/query`, { query });
  }
}

async function getAnonKey(ref) {
  const keys = await api("GET", `/projects/${ref}/api-keys`);
  const anon =
    keys.find((k) => k.name === "anon" || k.name === "anon key") ||
    keys.find((k) => k.tags?.includes?.("anon")) ||
    keys.find((k) => String(k.name).toLowerCase().includes("anon"));
  if (!anon?.api_key) {
    throw new Error(`Could not find anon key in ${JSON.stringify(keys)}`);
  }
  return anon.api_key;
}

async function configureAuth(ref) {
  console.log("Configuring Auth site URL + redirects…");
  await api("PATCH", `/projects/${ref}/config/auth`, {
    site_url: SITE_URL,
    uri_allow_list: [
      SITE_URL,
      `${SITE_URL}/**`,
      `${SITE_URL}/auth/callback`,
      "http://localhost:3000",
      "http://localhost:3000/**",
      "http://localhost:3000/auth/callback",
    ].join(","),
  });
}

function setVercelEnv(name, value) {
  for (const env of ["production", "preview", "development"]) {
    // Remove existing to allow overwrite
    spawnSync(
      "vercel",
      ["env", "rm", name, env, "--yes", "--scope", VERCEL_SCOPE],
      { encoding: "utf8" },
    );
    const result = spawnSync(
      "vercel",
      ["env", "add", name, env, "--scope", VERCEL_SCOPE],
      {
        input: value,
        encoding: "utf8",
      },
    );
    if (result.status !== 0) {
      throw new Error(
        `Failed to set ${name} (${env}): ${result.stderr || result.stdout}`,
      );
    }
    console.log(`  set ${name} → ${env}`);
  }
}

async function main() {
  const orgId = await ensureOrgId();
  const dbPass =
    process.env.SUPABASE_DB_PASSWORD ||
    `Phx_${randomBytes(18).toString("base64url")}`;
  const project = await ensureProject(orgId, dbPass);
  const ref = project.id || project.ref;
  if (!ref) throw new Error(`No project ref in ${JSON.stringify(project)}`);

  await waitHealthy(ref);
  await runMigrations(ref);
  const anonKey = await getAnonKey(ref);
  const url = `https://${ref}.supabase.co`;
  await configureAuth(ref);

  console.log("Writing Vercel env…");
  setVercelEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  setVercelEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);

  const secretNote = path.join(ROOT, ".data", "supabase-deploy.json");
  await fs.mkdir(path.dirname(secretNote), { recursive: true });
  await fs.writeFile(
    secretNote,
    JSON.stringify(
      {
        project_ref: ref,
        url,
        created_at: new Date().toISOString(),
        db_password_sha256: createHash("sha256").update(dbPass).digest("hex"),
        // password only stored locally under .data/ (gitignored)
        db_password: dbPass,
      },
      null,
      2,
    ),
  );
  console.log(`Saved local deploy metadata to ${secretNote} (gitignored)`);

  console.log("Redeploying Vercel production…");
  sh("vercel", ["deploy", "--prod", "-y", "--scope", VERCEL_SCOPE], {
    cwd: ROOT,
  });

  console.log(`
Supabase is live.

  Project:  ${ref}
  URL:      ${url}
  App:      ${SITE_URL}

Phone test:
  1. Open ${SITE_URL}
  2. Sign up with email/password
  3. Create a project — it should persist
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
