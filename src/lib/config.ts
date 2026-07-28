export function isAuthBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === "true";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getAppName(): string {
  return "Phoenux Case Study Assembler";
}

export function getDataMode(): "supabase" | "local" {
  if (isAuthBypassEnabled()) {
    return "local";
  }
  return isSupabaseConfigured() ? "supabase" : "local";
}

/** Vercel/serverless local JSON mode cannot persist .data/ across requests. */
export function isEphemeralHost(): boolean {
  return getDataMode() === "local" && process.env.VERCEL === "1";
}
