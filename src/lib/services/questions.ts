import { getDataMode } from "@/lib/config";
import type { Asset, Project, Source } from "@/lib/db/types";
import type {
  Answer,
  AnswerValue,
  CoverageSnapshot,
  CreateAnswerInput,
  Question,
} from "@/lib/db/question-types";
import {
  coverageScore,
  evaluateCoverage,
  getCoverageField,
  type CoverageContext,
} from "@/lib/questions/coverage";
import {
  createLocalAnswer,
  createLocalQuestion,
  getLocalQuestionByField,
  listLocalAnswers,
  listLocalAssets,
  listLocalQuestions,
  listLocalSources,
  updateLocalAssetsPermission,
  updateLocalProjectConfidence,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/services/projects";
import { listSources } from "@/lib/services/sources";
import { listAssets } from "@/lib/services/assets";

async function listQuestions(projectId: string): Promise<Question[]> {
  if (getDataMode() === "local") {
    return listLocalQuestions(projectId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Question[];
}

async function listAnswers(projectId: string): Promise<Answer[]> {
  if (getDataMode() === "local") {
    return listLocalAnswers(projectId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Answer[];
}

function answersByField(
  questions: Question[],
  answers: Answer[],
): Map<string, Answer> {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const map = new Map<string, Answer>();
  for (const answer of answers) {
    const question = questionById.get(answer.question_id);
    if (!question) continue;
    if (!map.has(question.field_key)) {
      map.set(question.field_key, answer);
    }
  }
  return map;
}

async function ensureQuestionForField(
  projectId: string,
  fieldKey: string,
  ctx: CoverageContext,
): Promise<Question> {
  const field = getCoverageField(fieldKey);
  if (!field) {
    throw new Error(`Unknown coverage field: ${fieldKey}`);
  }

  if (getDataMode() === "local") {
    const existing = await getLocalQuestionByField(projectId, fieldKey);
    if (existing) {
      return {
        ...existing,
        why: field.why(ctx),
      };
    }
    return createLocalQuestion({
      project_id: projectId,
      field_key: field.field_key,
      question_type: field.question_type,
      prompt: field.prompt,
      why: field.why(ctx),
      options: field.options,
    });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("questions")
    .select("*")
    .eq("project_id", projectId)
    .eq("field_key", fieldKey)
    .maybeSingle();

  if (existing) {
    return {
      ...(existing as Question),
      why: field.why(ctx),
    };
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      project_id: projectId,
      field_key: field.field_key,
      question_type: field.question_type,
      prompt: field.prompt,
      why: field.why(ctx),
      options: field.options ?? [],
      status: "open",
      confidence: "unknown",
      approval: "draft",
      provenance: {
        source: "coverage-model",
        method: "deterministic",
      },
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Question;
}

export async function getCoverageSnapshot(
  project: Project,
  sources?: Source[],
  assets?: Asset[],
): Promise<CoverageSnapshot> {
  const [resolvedSources, resolvedAssets, questions, answers] =
    await Promise.all([
      sources ?? listSources(project.id),
      assets ?? listAssets(project.id),
      listQuestions(project.id),
      listAnswers(project.id),
    ]);

  const ctx: CoverageContext = {
    project,
    sources: resolvedSources,
    assets: resolvedAssets,
    answersByField: answersByField(questions, answers),
  };

  const { gaps, applicable, answered } = evaluateCoverage(ctx);
  const nextGap = gaps[0] ?? null;
  const nextQuestion = nextGap
    ? await ensureQuestionForField(project.id, nextGap.field_key, ctx)
    : null;

  return {
    score: coverageScore(answered.length, applicable.length),
    answered: answered.length,
    total: applicable.length,
    gaps,
    next_question: nextQuestion,
  };
}

export async function submitAnswer(
  userId: string,
  input: CreateAnswerInput,
): Promise<Answer> {
  let answer: Answer;

  if (getDataMode() === "local") {
    answer = await createLocalAnswer(userId, input);
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("answers")
      .insert({
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
      })
      .select("*")
      .single();
    if (error) throw error;
    answer = data as Answer;

    await supabase
      .from("questions")
      .update({ status: "answered", updated_at: new Date().toISOString() })
      .eq("id", input.question_id);

    if (input.asset_links?.length) {
      const { error: linkError } = await supabase.from("answer_assets").insert(
        input.asset_links.map((link) => ({
          answer_id: answer.id,
          asset_id: link.asset_id,
          role: link.role,
        })),
      );
      if (linkError) throw linkError;
    }
  }

  await applySideEffects(input.project_id, input.value);
  return answer;
}

async function applySideEffects(
  projectId: string,
  value: AnswerValue,
): Promise<void> {
  if (value.confidence) {
    if (getDataMode() === "local") {
      await updateLocalProjectConfidence(projectId, value.confidence);
    } else {
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          confidence: value.confidence,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }
  }

  if (value.permission) {
    if (getDataMode() === "local") {
      await updateLocalAssetsPermission(projectId, value.permission);
    } else {
      const supabase = await createClient();
      await supabase
        .from("assets")
        .update({
          permission: value.permission,
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("permission", "internal");
    }
  }
}

export async function getProjectQuestionContext(
  projectId: string,
  ownerId: string,
) {
  const project = await getProject(projectId, ownerId);
  if (!project) return null;

  const [sources, assets] = await Promise.all([
    getDataMode() === "local"
      ? listLocalSources(projectId)
      : listSources(projectId),
    getDataMode() === "local"
      ? listLocalAssets(projectId)
      : listAssets(projectId),
  ]);

  const coverage = await getCoverageSnapshot(project, sources, assets);
  return { project, sources, assets, coverage };
}

export function parseAnswerFromFormData(
  question: Question,
  formData: FormData,
): { value: AnswerValue; asset_links: Array<{ asset_id: string; role: string }> } | { error: string } {
  const value: AnswerValue = {};
  const asset_links: Array<{ asset_id: string; role: string }> = [];

  switch (question.question_type) {
    case "boolean": {
      const raw = String(formData.get("boolean") || "");
      if (raw !== "true" && raw !== "false") {
        return { error: "Choose yes or no" };
      }
      value.boolean = raw === "true";
      break;
    }
    case "single_select":
    case "confidence":
    case "permission": {
      const selected = String(formData.get("selected") || "").trim();
      if (!selected) return { error: "Choose an option" };
      value.selected = [selected];
      if (question.question_type === "confidence") {
        value.confidence = selected as AnswerValue["confidence"];
      }
      if (question.question_type === "permission") {
        value.permission = selected as AnswerValue["permission"];
      }
      break;
    }
    case "multiple_select": {
      const selected = formData
        .getAll("selected")
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean);
      if (selected.length === 0) return { error: "Choose at least one option" };
      value.selected = selected;
      break;
    }
    case "short_text":
    case "long_text":
    case "number": {
      const text = String(formData.get("text") || "").trim();
      if (!text) return { error: "An answer is required" };
      value.text = text;
      if (question.question_type === "number") {
        const number = Number(text);
        if (Number.isNaN(number)) return { error: "Enter a valid number" };
        value.number = number;
      }
      break;
    }
    case "asset_selection": {
      const assetId = String(formData.get("asset_id") || "").trim();
      if (!assetId) return { error: "Select an image asset" };
      value.asset_ids = [assetId];
      asset_links.push({ asset_id: assetId, role: "primary" });
      break;
    }
    case "text_image": {
      const text = String(formData.get("text") || "").trim();
      const assetId = String(formData.get("asset_id") || "").trim();
      if (!text) return { error: "Explain the problem" };
      if (!assetId) return { error: "Select an image" };
      value.text = text;
      value.asset_ids = [assetId];
      asset_links.push({ asset_id: assetId, role: "supporting" });
      break;
    }
    case "before_after": {
      const before = String(formData.get("before_asset_id") || "").trim();
      const after = String(formData.get("after_asset_id") || "").trim();
      const text = String(formData.get("text") || "").trim();
      if (!before || !after) {
        return { error: "Select both before and after images" };
      }
      if (before === after) {
        return { error: "Before and after must be different assets" };
      }
      value.before_asset_id = before;
      value.after_asset_id = after;
      value.asset_ids = [before, after];
      if (text) value.text = text;
      asset_links.push(
        { asset_id: before, role: "before" },
        { asset_id: after, role: "after" },
      );
      break;
    }
    default:
      return { error: "Unsupported question type" };
  }

  return { value, asset_links };
}
