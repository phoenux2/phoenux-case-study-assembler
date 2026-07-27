import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type {
  Asset,
  CreateAssetInput,
  CreateProjectInput,
  CreateSourceInput,
  Profile,
  Project,
  Source,
} from "@/lib/db/types";

type LocalDb = {
  profiles: Profile[];
  projects: Project[];
  sources: Source[];
  assets: Asset[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "local-db.json");

const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

function now(): string {
  return new Date().toISOString();
}

function emptyDb(): LocalDb {
  return {
    profiles: [
      {
        id: LOCAL_USER_ID,
        email: "local@phoenux.dev",
        display_name: "Local User",
        created_at: now(),
        updated_at: now(),
      },
    ],
    projects: [],
    sources: [],
    assets: [],
  };
}

async function ensureDb(): Promise<LocalDb> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as LocalDb;
  } catch {
    const db = emptyDb();
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
}

async function saveDb(db: LocalDb): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export function getLocalUserId(): string {
  return LOCAL_USER_ID;
}

export async function getLocalProfile(): Promise<Profile> {
  const db = await ensureDb();
  return db.profiles[0];
}

export async function listLocalProjects(ownerId: string): Promise<Project[]> {
  const db = await ensureDb();
  return db.projects
    .filter((project) => project.owner_id === ownerId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getLocalProject(
  id: string,
  ownerId: string,
): Promise<Project | null> {
  const db = await ensureDb();
  return (
    db.projects.find(
      (project) => project.id === id && project.owner_id === ownerId,
    ) ?? null
  );
}

export async function createLocalProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const db = await ensureDb();
  const timestamp = now();
  const project: Project = {
    id: randomUUID(),
    owner_id: ownerId,
    title: input.title.trim(),
    client_name: input.client_name?.trim() || null,
    summary: input.summary?.trim() || null,
    status: "active",
    confidence: "unknown",
    approval: "draft",
    provenance: {
      source: "user",
      method: "user",
      created_by: ownerId,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.projects.push(project);
  await saveDb(db);
  return project;
}

export async function listLocalSources(projectId: string): Promise<Source[]> {
  const db = await ensureDb();
  return db.sources
    .filter((source) => source.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLocalSource(
  userId: string,
  input: CreateSourceInput,
): Promise<Source> {
  const db = await ensureDb();
  const timestamp = now();
  const source: Source = {
    id: randomUUID(),
    project_id: input.project_id,
    uploaded_by: userId,
    source_type: input.source_type,
    title: input.title.trim(),
    filename: input.filename ?? null,
    mime_type: input.mime_type ?? null,
    storage_path: input.storage_path ?? null,
    content_text: input.content_text ?? null,
    content_summary: input.content_summary ?? null,
    confidence: "medium",
    approval: "draft",
    provenance: {
      source: "user-upload",
      method: "user",
      created_by: userId,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.sources.push(source);
  await saveDb(db);
  return source;
}

export async function listLocalAssets(projectId: string): Promise<Asset[]> {
  const db = await ensureDb();
  return db.assets
    .filter((asset) => asset.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLocalAsset(
  userId: string,
  input: CreateAssetInput,
): Promise<Asset> {
  const db = await ensureDb();
  const timestamp = now();
  const asset: Asset = {
    id: randomUUID(),
    project_id: input.project_id,
    source_id: input.source_id ?? null,
    uploaded_by: userId,
    title: input.title.trim(),
    filename: input.filename ?? null,
    mime_type: input.mime_type ?? null,
    storage_path: input.storage_path ?? null,
    category: input.category ?? null,
    phase: input.phase ?? "unknown",
    permission: input.permission ?? "internal",
    quality: "unreviewed",
    description: input.description ?? null,
    caption: input.caption ?? null,
    relationships: [],
    annotations: [],
    confidence: "medium",
    approval: "draft",
    provenance: {
      source: "user-upload",
      method: "user",
      created_by: userId,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.assets.push(asset);
  await saveDb(db);
  return asset;
}

export async function updateLocalAsset(
  assetId: string,
  projectId: string,
  patch: Partial<
    Pick<
      Asset,
      | "title"
      | "category"
      | "phase"
      | "permission"
      | "description"
      | "caption"
    >
  >,
): Promise<Asset | null> {
  const db = await ensureDb();
  const index = db.assets.findIndex(
    (asset) => asset.id === assetId && asset.project_id === projectId,
  );
  if (index < 0) return null;
  db.assets[index] = {
    ...db.assets[index],
    ...patch,
    updated_at: now(),
  };
  await saveDb(db);
  return db.assets[index];
}

/** Test helper — reset local DB between unit tests. */
export async function resetLocalDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(emptyDb(), null, 2));
}
