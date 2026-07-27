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
import type {
  Answer,
  AnswerAsset,
  CreateAnswerInput,
  CreateQuestionInput,
  Question,
} from "@/lib/db/question-types";

type LocalDb = {
  profiles: Profile[];
  projects: Project[];
  sources: Source[];
  assets: Asset[];
  questions: Question[];
  answers: Answer[];
  answer_assets: AnswerAsset[];
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
    questions: [],
    answers: [],
    answer_assets: [],
  };
}

async function ensureDb(): Promise<LocalDb> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      ...emptyDb(),
      ...parsed,
      questions: parsed.questions ?? [],
      answers: parsed.answers ?? [],
      answer_assets: parsed.answer_assets ?? [],
    };
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

export async function listLocalQuestions(projectId: string): Promise<Question[]> {
  const db = await ensureDb();
  return db.questions
    .filter((question) => question.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getLocalQuestionByField(
  projectId: string,
  fieldKey: string,
): Promise<Question | null> {
  const db = await ensureDb();
  return (
    db.questions.find(
      (question) =>
        question.project_id === projectId && question.field_key === fieldKey,
    ) ?? null
  );
}

export async function createLocalQuestion(
  input: CreateQuestionInput,
): Promise<Question> {
  const db = await ensureDb();
  const existing = db.questions.find(
    (question) =>
      question.project_id === input.project_id &&
      question.field_key === input.field_key,
  );
  if (existing) return existing;

  const timestamp = now();
  const question: Question = {
    id: randomUUID(),
    project_id: input.project_id,
    field_key: input.field_key,
    question_type: input.question_type,
    prompt: input.prompt,
    why: input.why ?? null,
    options: input.options ?? [],
    status: "open",
    confidence: "unknown",
    approval: "draft",
    provenance: {
      source: "coverage-model",
      method: "deterministic",
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.questions.push(question);
  await saveDb(db);
  return question;
}

export async function listLocalAnswers(projectId: string): Promise<Answer[]> {
  const db = await ensureDb();
  return db.answers
    .filter((answer) => answer.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createLocalAnswer(
  userId: string,
  input: CreateAnswerInput,
): Promise<Answer> {
  const db = await ensureDb();
  const timestamp = now();
  const answer: Answer = {
    id: randomUUID(),
    question_id: input.question_id,
    project_id: input.project_id,
    answered_by: userId,
    value: input.value,
    confidence: input.confidence ?? "medium",
    approval: "draft",
    provenance: {
      source: "user",
      method: "user",
      created_by: userId,
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.answers.push(answer);

  const questionIndex = db.questions.findIndex(
    (question) => question.id === input.question_id,
  );
  if (questionIndex >= 0) {
    db.questions[questionIndex] = {
      ...db.questions[questionIndex],
      status: "answered",
      updated_at: timestamp,
    };
  }

  for (const link of input.asset_links ?? []) {
    db.answer_assets.push({
      answer_id: answer.id,
      asset_id: link.asset_id,
      role: link.role,
    });
  }

  await saveDb(db);
  return answer;
}

export async function updateLocalProjectConfidence(
  projectId: string,
  confidence: Project["confidence"],
): Promise<void> {
  const db = await ensureDb();
  const index = db.projects.findIndex((project) => project.id === projectId);
  if (index < 0) return;
  db.projects[index] = {
    ...db.projects[index],
    confidence,
    updated_at: now(),
  };
  await saveDb(db);
}

export async function updateLocalAssetsPermission(
  projectId: string,
  permission: Asset["permission"],
): Promise<void> {
  const db = await ensureDb();
  const timestamp = now();
  db.assets = db.assets.map((asset) =>
    asset.project_id === projectId && asset.permission === "internal"
      ? { ...asset, permission, updated_at: timestamp }
      : asset,
  );
  await saveDb(db);
}

/** Test helper — reset local DB between unit tests. */
export async function resetLocalDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(emptyDb(), null, 2));
}
