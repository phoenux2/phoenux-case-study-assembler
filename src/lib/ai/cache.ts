import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type { PromptId } from "@/lib/ai/prompts";

const CACHE_DIR = path.join(process.cwd(), ".data", "ai-cache");

export type AiCacheRecord<T> = {
  prompt_id: PromptId;
  version: string;
  input_hash: string;
  created_at: string;
  provider: string;
  result: T;
};

function cachePath(inputHash: string): string {
  return path.join(CACHE_DIR, `${inputHash}.json`);
}

export async function readAiCache<T>(
  inputHash: string,
): Promise<AiCacheRecord<T> | null> {
  try {
    const raw = await fs.readFile(cachePath(inputHash), "utf8");
    return JSON.parse(raw) as AiCacheRecord<T>;
  } catch {
    return null;
  }
}

export async function writeAiCache<T>(
  record: AiCacheRecord<T>,
): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath(record.input_hash), JSON.stringify(record, null, 2));
}

export function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
