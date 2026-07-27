import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAppName, getDataMode } from "@/lib/config";

export function AppHeader({
  email,
}: {
  email?: string | null;
}) {
  const mode = getDataMode();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FolderKanban data-icon="inline-start" />
          <span className="font-heading text-lg font-semibold tracking-tight">
            {getAppName()}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {mode === "local" ? "Local mode" : "Supabase"}
          </Badge>
          {email ? (
            <span className="text-sm text-muted-foreground">{email}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
