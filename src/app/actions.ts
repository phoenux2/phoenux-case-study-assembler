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
