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
import type {
  Claim,
  ContentBlock,
  Evidence,
  OutputPayload,
  OutputRecord,
  OutputType,
} from "@/lib/db/block-types";
import type { ApprovalStatus } from "@/lib/db/types";
import type { StructuredFactRecord } from "@/lib/db/ai-types";
import type { KnowledgeEntry } from "@/lib/db/phase4-types";

type LocalDb = {
  profiles: Profile[];
  projects: Project[];
  sources: Source[];
  assets: Asset[];
  questions: Question[];
  answers: Answer[];
  answer_assets: AnswerAsset[];
  content_blocks: ContentBlock[];
  claims: Claim[];
  evidence: Evidence[];
  outputs: OutputRecord[];
  facts: StructuredFactRecord[];
  knowledge_entries: KnowledgeEntry[];
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
    content_blocks: [],
    claims: [],
    evidence: [],
    outputs: [],
    facts: [],
    knowledge_entries: [],
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
      content_blocks: parsed.content_blocks ?? [],
      claims: parsed.claims ?? [],
      evidence: parsed.evidence ?? [],
      outputs: parsed.outputs ?? [],
      facts: parsed.facts ?? [],
      knowledge_entries: parsed.knowledge_entries ?? [],
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

export async function listLocalContentBlocks(
  projectId: string,
): Promise<ContentBlock[]> {
  const db = await ensureDb();
  return db.content_blocks
    .filter((block) => block.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function replaceLocalContentBlocks(
  projectId: string,
  blocks: Array<Omit<ContentBlock, "id" | "created_at" | "updated_at">>,
): Promise<ContentBlock[]> {
  const db = await ensureDb();
  const timestamp = now();
  db.content_blocks = db.content_blocks.filter(
    (block) => block.project_id !== projectId,
  );
  const created = blocks.map((block) => ({
    ...block,
    id: randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  }));
  db.content_blocks.push(...created);
  await saveDb(db);
  return created;
}

export async function listLocalClaims(projectId: string): Promise<Claim[]> {
  const db = await ensureDb();
  return db.claims
    .filter((claim) => claim.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function replaceLocalClaims(
  projectId: string,
  claims: Array<{
    claim_text: string;
    confidence: Claim["confidence"];
    evidence_summary: string;
    source_id?: string | null;
    asset_id?: string | null;
  }>,
): Promise<Claim[]> {
  const db = await ensureDb();
  const timestamp = now();
  const existingIds = new Set(
    db.claims.filter((claim) => claim.project_id === projectId).map((c) => c.id),
  );
  db.evidence = db.evidence.filter((item) => !existingIds.has(item.claim_id));
  db.claims = db.claims.filter((claim) => claim.project_id !== projectId);

  const created: Claim[] = [];
  for (const claim of claims) {
    const record: Claim = {
      id: randomUUID(),
      project_id: projectId,
      claim_text: claim.claim_text,
      confidence: claim.confidence,
      approval: "draft",
      provenance: {
        source: "assembled-from-answers",
        method: "deterministic",
      },
      created_at: timestamp,
      updated_at: timestamp,
    };
    created.push(record);
    db.claims.push(record);
    db.evidence.push({
      id: randomUUID(),
      claim_id: record.id,
      source_id: claim.source_id ?? null,
      asset_id: claim.asset_id ?? null,
      summary: claim.evidence_summary,
      confidence: claim.confidence,
      approval: "draft",
      provenance: {
        source: "assembled-from-answers",
        method: "deterministic",
      },
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
  await saveDb(db);
  return created;
}

export async function listLocalEvidence(claimId: string): Promise<Evidence[]> {
  const db = await ensureDb();
  return db.evidence.filter((item) => item.claim_id === claimId);
}

export async function listLocalEvidenceForProject(
  projectId: string,
): Promise<Evidence[]> {
  const db = await ensureDb();
  const claimIds = new Set(
    db.claims
      .filter((claim) => claim.project_id === projectId)
      .map((claim) => claim.id),
  );
  return db.evidence.filter((item) => claimIds.has(item.claim_id));
}

export async function setLocalApproval(input: {
  entity: "content_block" | "claim" | "asset" | "output";
  id: string;
  projectId: string;
  approval: ApprovalStatus;
}): Promise<boolean> {
  const db = await ensureDb();
  const timestamp = now();

  if (input.entity === "content_block") {
    const index = db.content_blocks.findIndex(
      (block) => block.id === input.id && block.project_id === input.projectId,
    );
    if (index < 0) return false;
    db.content_blocks[index] = {
      ...db.content_blocks[index],
      approval: input.approval,
      updated_at: timestamp,
    };
  } else if (input.entity === "claim") {
    const index = db.claims.findIndex(
      (claim) => claim.id === input.id && claim.project_id === input.projectId,
    );
    if (index < 0) return false;
    db.claims[index] = {
      ...db.claims[index],
      approval: input.approval,
      updated_at: timestamp,
    };
  } else if (input.entity === "asset") {
    const index = db.assets.findIndex(
      (asset) => asset.id === input.id && asset.project_id === input.projectId,
    );
    if (index < 0) return false;
    db.assets[index] = {
      ...db.assets[index],
      approval: input.approval,
      updated_at: timestamp,
    };
  } else {
    const index = db.outputs.findIndex(
      (output) =>
        output.id === input.id && output.project_id === input.projectId,
    );
    if (index < 0) return false;
    db.outputs[index] = {
      ...db.outputs[index],
      approval: input.approval,
      updated_at: timestamp,
    };
  }

  await saveDb(db);
  return true;
}

export async function listLocalOutputs(
  projectId: string,
): Promise<OutputRecord[]> {
  const db = await ensureDb();
  return db.outputs
    .filter((output) => output.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLocalOutput(
  outputId: string,
  projectId: string,
): Promise<OutputRecord | null> {
  const db = await ensureDb();
  return (
    db.outputs.find(
      (output) => output.id === outputId && output.project_id === projectId,
    ) ?? null
  );
}

export async function createLocalOutput(input: {
  project_id: string;
  output_type: OutputType;
  payload: OutputPayload;
}): Promise<OutputRecord> {
  const db = await ensureDb();
  const timestamp = now();
  const output: OutputRecord = {
    id: randomUUID(),
    project_id: input.project_id,
    output_type: input.output_type,
    payload: input.payload,
    confidence: "medium",
    approval: "draft",
    provenance: {
      source: "assembly-engine",
      method: "deterministic",
    },
    created_at: timestamp,
    updated_at: timestamp,
  };
  db.outputs.push(output);
  await saveDb(db);
  return output;
}

export async function updateLocalOutputPayload(
  outputId: string,
  projectId: string,
  payload: OutputPayload,
  options?: { resetApproval?: boolean },
): Promise<OutputRecord | null> {
  const db = await ensureDb();
  const index = db.outputs.findIndex(
    (output) => output.id === outputId && output.project_id === projectId,
  );
  if (index < 0) return null;
  const timestamp = now();
  db.outputs[index] = {
    ...db.outputs[index],
    payload,
    approval: options?.resetApproval ? "draft" : db.outputs[index].approval,
    updated_at: timestamp,
  };
  await saveDb(db);
  return db.outputs[index];
}


export async function listLocalFacts(projectId: string): Promise<StructuredFactRecord[]> {
  const db = await ensureDb();
  return db.facts
    .filter((fact) => fact.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function upsertLocalFacts(
  projectId: string,
  sourceId: string | null,
  facts: Array<Omit<StructuredFactRecord, "id" | "created_at" | "updated_at" | "project_id">>,
): Promise<StructuredFactRecord[]> {
  const db = await ensureDb();
  const timestamp = now();
  const created: StructuredFactRecord[] = [];
  for (const fact of facts) {
    const existingIndex = db.facts.findIndex(
      (row) =>
        row.project_id === projectId &&
        row.key === fact.key &&
        row.value === fact.value,
    );
    if (existingIndex >= 0) {
      created.push(db.facts[existingIndex]);
      continue;
    }
    const record: StructuredFactRecord = {
      id: randomUUID(),
      project_id: projectId,
      source_id: sourceId,
      key: fact.key,
      value: fact.value,
      confidence: fact.confidence,
      provenance: fact.provenance,
      created_at: timestamp,
      updated_at: timestamp,
    };
    db.facts.push(record);
    created.push(record);
  }
  await saveDb(db);
  return created;
}


export async function listLocalKnowledge(projectId: string): Promise<KnowledgeEntry[]> {
  const db = await ensureDb();
  return db.knowledge_entries
    .filter((entry) => entry.project_id === projectId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function replaceLocalKnowledge(
  projectId: string,
  entries: Array<Omit<KnowledgeEntry, "id" | "created_at" | "updated_at">>,
): Promise<KnowledgeEntry[]> {
  const db = await ensureDb();
  const timestamp = now();
  db.knowledge_entries = db.knowledge_entries.filter(
    (entry) => entry.project_id !== projectId,
  );
  const created = entries.map((entry) => ({
    ...entry,
    id: randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  }));
  db.knowledge_entries.push(...created);
  await saveDb(db);
  return created;
}

export async function updateLocalAssetVision(
  assetId: string,
  projectId: string,
  patch: Partial<
    Pick<Asset, "title" | "category" | "phase" | "description" | "caption" | "annotations" | "confidence">
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
