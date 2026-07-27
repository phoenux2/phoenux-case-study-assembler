import {
  getAiApiKey,
  getAiBaseUrl,
  getAiModel,
  getAiProviderLabel,
  isAiEnabled,
} from "@/lib/ai/config";
import { readAiCache, writeAiCache } from "@/lib/ai/cache";
import {
  hashPromptInput,
  renderPrompt,
  type PromptId,
} from "@/lib/ai/prompts";

export type AiCallResult<T> = {
  ok: boolean;
  result?: T;
  error?: string;
  cached: boolean;
  provider: string;
  prompt_id: PromptId;
  version: string;
  used_ai: boolean;
};

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON");
  }
}

async function callOpenAiCompatible(prompt: string): Promise<string> {
  const apiKey = getAiApiKey();
  if (!apiKey) throw new Error("AI API key missing");

  const response = await fetch(`${getAiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAiModel(),
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON. Never invent metrics, research, results, or client names.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI provider error (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned empty content");
  return content;
}

/**
 * Run one versioned prompt. Always cache. Prefer deterministic fallback when AI is off/fails.
 */
export async function runAiTask<T>(input: {
  promptId: PromptId;
  variables: Record<string, string>;
  cacheInput: unknown;
  parse: (value: unknown) => T;
  fallback: () => T | Promise<T>;
}): Promise<AiCallResult<T>> {
  const { definition, prompt } = renderPrompt(input.promptId, input.variables);
  const inputHash = hashPromptInput(
    definition.id,
    definition.version,
    input.cacheInput,
  );
  const provider = getAiProviderLabel();

  const cached = await readAiCache<T>(inputHash);
  if (cached) {
    return {
      ok: true,
      result: cached.result,
      cached: true,
      provider: cached.provider,
      prompt_id: definition.id,
      version: definition.version,
      used_ai: cached.provider !== "deterministic",
    };
  }

  if (!isAiEnabled()) {
    const result = await input.fallback();
    await writeAiCache({
      prompt_id: definition.id,
      version: definition.version,
      input_hash: inputHash,
      created_at: new Date().toISOString(),
      provider: "deterministic",
      result,
    });
    return {
      ok: true,
      result,
      cached: false,
      provider: "deterministic",
      prompt_id: definition.id,
      version: definition.version,
      used_ai: false,
    };
  }

  try {
    const raw = await callOpenAiCompatible(prompt);
    const parsed = input.parse(extractJsonObject(raw));
    await writeAiCache({
      prompt_id: definition.id,
      version: definition.version,
      input_hash: inputHash,
      created_at: new Date().toISOString(),
      provider,
      result: parsed,
    });
    return {
      ok: true,
      result: parsed,
      cached: false,
      provider,
      prompt_id: definition.id,
      version: definition.version,
      used_ai: true,
    };
  } catch (error) {
    const result = await input.fallback();
    await writeAiCache({
      prompt_id: definition.id,
      version: definition.version,
      input_hash: inputHash,
      created_at: new Date().toISOString(),
      provider: "deterministic-fallback",
      result,
    });
    return {
      ok: true,
      result,
      cached: false,
      provider: "deterministic-fallback",
      prompt_id: definition.id,
      version: definition.version,
      used_ai: false,
      error: error instanceof Error ? error.message : "AI call failed",
    };
  }
}
