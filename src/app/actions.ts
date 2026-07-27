"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/lib/auth/session";
import { createProjectSchema, createTextSourceSchema } from "@/lib/db/schemas";
import { getProject, createProject } from "@/lib/services/projects";
import { createSource } from "@/lib/services/sources";
import { createAsset, isImageMimeType } from "@/lib/services/assets";
import {
  getCoverageSnapshot,
  parseAnswerFromFormData,
  submitAnswer,
} from "@/lib/services/questions";
import { listLocalQuestions } from "@/lib/local/store";
import { getDataMode } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/db/question-types";
import { rebuildContentBlocks } from "@/lib/services/blocks";
import { createOutput, setApproval } from "@/lib/services/outputs";
import type { OutputType } from "@/lib/db/block-types";
import type { ApprovalStatus } from "@/lib/db/types";
import {
  getAiStatus,
  runClaimReview,
  runEditorial,
  runExtraction,
  runGapDetection,
  runQuestionRefinement,
} from "@/lib/services/ai-pipeline";
import { analyzeAssetVision } from "@/lib/services/vision";
import { figmaStatus, importFigmaFile } from "@/lib/services/figma";
import {
  listKnowledge,
  rebuildKnowledgeBase,
  searchKnowledge,
} from "@/lib/services/knowledge";
import type { RetrievalHit } from "@/lib/db/phase4-types";

export type ActionResult = {
  ok: boolean;
  error?: string;
};

export async function createProjectAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    client_name: formData.get("client_name") || "",
    summary: formData.get("summary") || "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const project = await createProject(user.id, {
    title: parsed.data.title,
    client_name: parsed.data.client_name || undefined,
    summary: parsed.data.summary || undefined,
  });

  redirect(`/projects/${project.id}`);
}

export async function addTextSourceAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const project = await getProject(projectId, user.id);
  if (!project) return { ok: false, error: "Project not found" };

  const parsed = createTextSourceSchema.safeParse({
    title: formData.get("title"),
    content_text: formData.get("content_text"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createSource(user.id, {
    project_id: projectId,
    source_type: "text",
    title: parsed.data.title,
    content_text: parsed.data.content_text,
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function uploadFileAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const project = await getProject(projectId, user.id);
  if (!project) return { ok: false, error: "Project not found" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload" };
  }

  const title =
    String(formData.get("title") || "").trim() ||
    file.name.replace(/\.[^.]+$/, "") ||
    "Uploaded file";

  const bytes = Buffer.from(await file.arrayBuffer());
  const storagePath = `local/${user.id}/${projectId}/${Date.now()}-${file.name}`;

  // Persist bytes for local mode so assets remain inspectable without Supabase Storage.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), ".data", "uploads", storagePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, bytes);
  }

  const source = await createSource(user.id, {
    project_id: projectId,
    source_type: "file",
    title,
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    storage_path: storagePath,
    content_summary: `Uploaded file: ${file.name} (${file.size} bytes)`,
  });

  if (isImageMimeType(file.type)) {
    await createAsset(user.id, {
      project_id: projectId,
      source_id: source.id,
      title,
      filename: file.name,
      mime_type: file.type,
      storage_path: storagePath,
      category: "screenshot",
      permission: "internal",
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

async function getQuestion(
  projectId: string,
  questionId: string,
): Promise<Question | null> {
  if (getDataMode() === "local") {
    const questions = await listLocalQuestions(projectId);
    return questions.find((question) => question.id === questionId) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data as Question | null;
}

export async function answerQuestionAction(
  projectId: string,
  questionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const project = await getProject(projectId, user.id);
  if (!project) return { ok: false, error: "Project not found" };

  const question = await getQuestion(projectId, questionId);
  if (!question) return { ok: false, error: "Question not found" };

  const parsed = parseAnswerFromFormData(question, formData);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  await submitAnswer(user.id, {
    question_id: question.id,
    project_id: projectId,
    value: parsed.value,
    confidence:
      parsed.value.confidence ??
      (typeof parsed.value.boolean === "boolean" ? "high" : "medium"),
    asset_links: parsed.asset_links,
  });

  await getCoverageSnapshot(project);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function rebuildBlocksAction(
  projectId: string,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  await rebuildContentBlocks(projectId, user.id);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function setApprovalAction(
  projectId: string,
  entity: "content_block" | "claim" | "asset" | "output",
  id: string,
  approval: ApprovalStatus,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const result = await setApproval({
    entity,
    id,
    projectId,
    ownerId: user.id,
    approval,
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/projects/${projectId}`);
  if (entity === "output") {
    revalidatePath(`/projects/${projectId}/outputs/${id}`);
  }
  return { ok: true };
}

export async function createOutputAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const outputType = String(formData.get("output_type") || "") as OutputType;
  const allowed: OutputType[] = [
    "website",
    "linkedin_carousel",
    "linkedin_post",
    "upwork",
    "pdf",
  ];
  if (!allowed.includes(outputType)) {
    return { ok: false, error: "Choose a valid output type" };
  }

  const result = await createOutput(projectId, user.id, outputType);
  if (result.error) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/projects/${projectId}`);
  if (result.output) {
    redirect(`/projects/${projectId}/outputs/${result.output.id}`);
  }
  return { ok: true };
}

export type PipelineActionResult = ActionResult & {
  summary?: string;
  meta?: string;
};

function formatMeta(meta: {
  used_ai: boolean;
  provider: string;
  cached: boolean;
}): string {
  return `${meta.provider}${meta.cached ? " · cached" : ""}${
    meta.used_ai ? " · ai" : " · deterministic"
  }`;
}

export async function runExtractionAction(
  projectId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { extraction, meta } = await runExtraction(projectId, user.id);
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: true,
      summary: [
        `Facts: ${extraction.facts.map((fact) => `${fact.key}=${fact.value}`).join("; ") || "none"}`,
        extraction.unsupported_claims.length
          ? `Unsupported: ${extraction.unsupported_claims.join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Extraction failed",
    };
  }
}

export async function runGapDetectionAction(
  projectId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { result, meta } = await runGapDetection(projectId, user.id);
    return {
      ok: true,
      summary: [
        `Coverage score: ${result.coverage_score}`,
        ...result.gaps.map(
          (gap) => `[${gap.severity}] ${gap.field}: ${gap.reason}`,
        ),
        result.blocked_outputs.length
          ? `Blocked outputs: ${result.blocked_outputs.join(", ")}`
          : "No blocked outputs",
      ].join("\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gap detection failed",
    };
  }
}

export async function runQuestionRefinementAction(
  projectId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { result, meta } = await runQuestionRefinement(projectId, user.id);
    return {
      ok: true,
      summary: result.questions
        .map((question) => `${question.text}\nWhy: ${question.why}`)
        .join("\n\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Question refinement failed",
    };
  }
}

export async function runClaimReviewAction(
  projectId: string,
  claimId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { result, meta } = await runClaimReview(projectId, user.id, claimId);
    return {
      ok: true,
      summary: [
        `Verdict: ${result.verdict}`,
        result.reasoning,
        result.missing_evidence.length
          ? `Missing: ${result.missing_evidence.join("; ")}`
          : null,
        result.permission_issues.length
          ? `Permissions: ${result.permission_issues.join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Claim review failed",
    };
  }
}

export async function runEditorialAction(
  projectId: string,
  outputType: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { result, meta } = await runEditorial(
      projectId,
      user.id,
      outputType,
    );
    return {
      ok: true,
      summary: [
        ...result.sections.map(
          (section) => `${section.heading}\n${section.body}`,
        ),
        ...result.editorial_notes,
      ].join("\n\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Editorial failed",
    };
  }
}

export async function getAiStatusAction() {
  return getAiStatus();
}

export async function analyzeVisionAction(
  projectId: string,
  assetId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const { analysis, meta } = await analyzeAssetVision(
      projectId,
      user.id,
      assetId,
    );
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: true,
      summary: [
        `Title: ${analysis.title_suggestion}`,
        `Category: ${analysis.category}`,
        `Phase: ${analysis.phase}`,
        analysis.description,
        analysis.ui_elements.length
          ? `UI cues: ${analysis.ui_elements.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      meta: formatMeta(meta),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Vision failed",
    };
  }
}

export async function importFigmaAction(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const figmaUrl = String(formData.get("figma_url") || "").trim();
  if (!figmaUrl) return { ok: false, error: "Figma URL or key is required" };

  try {
    await importFigmaFile(projectId, user.id, figmaUrl);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Figma import failed",
    };
  }
}

export async function rebuildKnowledgeAction(
  projectId: string,
): Promise<PipelineActionResult> {
  const user = await requireSessionUser();
  try {
    const entries = await rebuildKnowledgeBase(projectId, user.id);
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: true,
      summary: `Indexed ${entries.length} knowledge entries`,
      meta: "deterministic",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Knowledge rebuild failed",
    };
  }
}

export async function searchKnowledgeAction(
  projectId: string,
  query: string,
): Promise<PipelineActionResult & { hits?: RetrievalHit[] }> {
  const user = await requireSessionUser();
  try {
    const result = await searchKnowledge(projectId, user.id, query);
    return {
      ok: true,
      summary: `${result.hits.length} hits for “${result.query}”`,
      meta: result.notes[0],
      hits: result.hits,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

export async function getFigmaStatusAction() {
  return figmaStatus();
}

export async function listKnowledgeAction(projectId: string) {
  return listKnowledge(projectId);
}
