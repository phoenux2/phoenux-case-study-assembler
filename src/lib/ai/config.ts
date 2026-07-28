function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function isAiEnabled(): boolean {
  if (process.env.AI_ENABLED === "false") return false;
  return Boolean(
    process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.KIMI_API_KEY,
  );
}

export function getAiProviderLabel():
  | "disabled"
  | "openai-compatible"
  | "kimi-compatible" {
  if (!isAiEnabled()) return "disabled";

  const baseUrl = getAiBaseUrl();
  const hasKimiKey = Boolean(process.env.KIMI_API_KEY);
  const kimiBase = /moonshot|kimi/i.test(baseUrl);
  if (hasKimiKey || kimiBase) {
    return "kimi-compatible";
  }
  return "openai-compatible";
}

export function getAiApiKey(): string | null {
  return (
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.KIMI_API_KEY ||
    null
  );
}

export function getAiBaseUrl(): string {
  return (
    normalizeBaseUrl(process.env.AI_BASE_URL) ||
    normalizeBaseUrl(process.env.KIMI_BASE_URL) ||
    normalizeBaseUrl(process.env.OPENAI_BASE_URL) ||
    "https://api.openai.com/v1"
  );
}

export function getAiModel(): string {
  return process.env.AI_MODEL || process.env.KIMI_MODEL || "gpt-4o-mini";
}
