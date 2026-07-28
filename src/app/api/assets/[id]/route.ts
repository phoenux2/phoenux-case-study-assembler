import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { getDataMode } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

function contentTypeFor(mimeType: string | null, filename: string | null) {
  if (mimeType) return mimeType;
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (getDataMode() === "local") {
    // Local assets are project-scoped; scan for the matching id.
    const { promises: fsp } = await import("fs");
    const dbPath = path.join(process.cwd(), ".data", "local-db.json");
    try {
      const raw = await fsp.readFile(dbPath, "utf8");
      const db = JSON.parse(raw) as {
        assets?: Array<{
          id: string;
          storage_path: string | null;
          mime_type: string | null;
          filename: string | null;
        }>;
      };
      const asset = db.assets?.find((item) => item.id === id);
      if (!asset?.storage_path) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      if (
        asset.storage_path.startsWith("http://") ||
        asset.storage_path.startsWith("https://") ||
        asset.storage_path.startsWith("data:")
      ) {
        return NextResponse.redirect(asset.storage_path);
      }

      const fullPath = path.join(
        process.cwd(),
        ".data",
        "uploads",
        asset.storage_path,
      );
      const bytes = await fs.readFile(fullPath);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": contentTypeFor(asset.mime_type, asset.filename),
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, storage_path, mime_type, filename")
    .eq("id", id)
    .maybeSingle();

  if (error || !data?.storage_path) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (
    data.storage_path.startsWith("http://") ||
    data.storage_path.startsWith("https://") ||
    data.storage_path.startsWith("data:")
  ) {
    return NextResponse.redirect(data.storage_path);
  }

  // Supabase Storage path — redirect to a signed URL when possible.
  const { data: signed, error: signedError } = await supabase.storage
    .from("assets")
    .createSignedUrl(data.storage_path, 60 * 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Unable to resolve asset URL" },
      { status: 404 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
