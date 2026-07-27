import { getDataMode } from "@/lib/config";
import { assembleDraftBlocks } from "@/lib/blocks/assemble";
import type {
  Claim,
  ContentBlock,
  Evidence,
} from "@/lib/db/block-types";
import type { Answer, Question } from "@/lib/db/question-types";
import {
  listLocalAnswers,
  listLocalAssets,
  listLocalClaims,
  listLocalContentBlocks,
  listLocalEvidence,
  listLocalEvidenceForProject,
  listLocalQuestions,
  listLocalSources,
  replaceLocalClaims,
  replaceLocalContentBlocks,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/services/projects";
import { listAssets } from "@/lib/services/assets";
import { listSources } from "@/lib/services/sources";

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

async function loadAssemblyInputs(projectId: string) {
  if (getDataMode() === "local") {
    const [sources, assets, questions, answers] = await Promise.all([
      listLocalSources(projectId),
      listLocalAssets(projectId),
      listLocalQuestions(projectId),
      listLocalAnswers(projectId),
    ]);
    return { sources, assets, questions, answers };
  }

  const supabase = await createClient();
  const [
    { data: sources, error: sourcesError },
    { data: assets, error: assetsError },
    { data: questions, error: questionsError },
    { data: answers, error: answersError },
  ] = await Promise.all([
    supabase.from("sources").select("*").eq("project_id", projectId),
    supabase.from("assets").select("*").eq("project_id", projectId),
    supabase.from("questions").select("*").eq("project_id", projectId),
    supabase.from("answers").select("*").eq("project_id", projectId),
  ]);
  if (sourcesError) throw sourcesError;
  if (assetsError) throw assetsError;
  if (questionsError) throw questionsError;
  if (answersError) throw answersError;
  return {
    sources: sources ?? [],
    assets: assets ?? [],
    questions: (questions ?? []) as Question[],
    answers: (answers ?? []) as Answer[],
  };
}

export async function listContentBlocks(
  projectId: string,
): Promise<ContentBlock[]> {
  if (getDataMode() === "local") {
    return listLocalContentBlocks(projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContentBlock[];
}

export async function listClaims(projectId: string): Promise<Claim[]> {
  if (getDataMode() === "local") {
    return listLocalClaims(projectId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Claim[];
}

export async function listEvidenceForClaim(
  claimId: string,
): Promise<Evidence[]> {
  if (getDataMode() === "local") {
    return listLocalEvidence(claimId);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .eq("claim_id", claimId);
  if (error) throw error;
  return (data ?? []) as Evidence[];
}

export async function listEvidenceForProject(
  projectId: string,
): Promise<Evidence[]> {
  if (getDataMode() === "local") {
    return listLocalEvidenceForProject(projectId);
  }
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select("id")
    .eq("project_id", projectId);
  if (claimsError) throw claimsError;
  const claimIds = (claims ?? []).map((claim) => claim.id as string);
  if (claimIds.length === 0) return [];

  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .in("claim_id", claimIds);
  if (error) throw error;
  return (data ?? []) as Evidence[];
}

export async function rebuildContentBlocks(
  projectId: string,
  ownerId: string,
): Promise<{ blocks: ContentBlock[]; claims: Claim[] }> {
  const project = await getProject(projectId, ownerId);
  if (!project) throw new Error("Project not found");

  const { sources, assets, questions, answers } =
    await loadAssemblyInputs(projectId);
  const draft = assembleDraftBlocks({
    project,
    sources,
    assets,
    questions,
    answers,
    answersByField: answersByField(questions, answers),
  });

  if (getDataMode() === "local") {
    const blocks = await replaceLocalContentBlocks(
      projectId,
      draft.blocks.map((block) => ({
        project_id: projectId,
        block_type: block.block_type,
        title: block.title,
        body: block.body,
        confidence: block.confidence,
        approval: "draft",
        provenance: {
          source: "assembly-engine",
          method: "deterministic",
        },
      })),
    );
    const claims = await replaceLocalClaims(projectId, draft.claims);
    return { blocks, claims };
  }

  const supabase = await createClient();
  await supabase.from("content_blocks").delete().eq("project_id", projectId);
  await supabase.from("claims").delete().eq("project_id", projectId);

  const { data: blocks, error: blocksError } = await supabase
    .from("content_blocks")
    .insert(
      draft.blocks.map((block) => ({
        project_id: projectId,
        block_type: block.block_type,
        title: block.title,
        body: block.body,
        confidence: block.confidence,
        approval: "draft",
        provenance: {
          source: "assembly-engine",
          method: "deterministic",
        },
      })),
    )
    .select("*");
  if (blocksError) throw blocksError;

  const createdClaims: Claim[] = [];
  for (const claim of draft.claims) {
    const { data: created, error } = await supabase
      .from("claims")
      .insert({
        project_id: projectId,
        claim_text: claim.claim_text,
        confidence: claim.confidence,
        approval: "draft",
        provenance: {
          source: "assembled-from-answers",
          method: "deterministic",
        },
      })
      .select("*")
      .single();
    if (error) throw error;
    createdClaims.push(created as Claim);
    await supabase.from("evidence").insert({
      claim_id: created.id,
      source_id: claim.source_id ?? null,
      asset_id: claim.asset_id ?? null,
      summary: claim.evidence_summary,
      confidence: claim.confidence,
      approval: "draft",
      provenance: {
        source: "assembled-from-answers",
        method: "deterministic",
      },
    });
  }

  return {
    blocks: (blocks ?? []) as ContentBlock[],
    claims: createdClaims,
  };
}

export async function getProjectAssemblyState(
  projectId: string,
  ownerId: string,
) {
  const project = await getProject(projectId, ownerId);
  if (!project) return null;

  const [sources, assets, blocks, claims] = await Promise.all([
    getDataMode() === "local"
      ? listLocalSources(projectId)
      : listSources(projectId),
    getDataMode() === "local"
      ? listLocalAssets(projectId)
      : listAssets(projectId),
    listContentBlocks(projectId),
    listClaims(projectId),
  ]);

  return { project, sources, assets, blocks, claims };
}
