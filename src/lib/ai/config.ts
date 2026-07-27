export function isAiEnabled(): boolean {
  if (process.env.AI_ENABLED === "false") return false;
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
}

export function getAiProviderLabel(): "disabled" | "openai-compatible" {
  return isAiEnabled() ? "openai-compatible" : "disabled";
}

export function getAiApiKey(): string | null {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || null;
}

export function getAiBaseUrl(): string {
  return (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1"
  );
}

export function getAiModel(): string {
  return process.env.AI_MODEL || "gpt-4o-mini";
}
