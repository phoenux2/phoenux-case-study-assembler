import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAppName, getDataMode } from "@/lib/config";
import { isAiEnabled } from "@/lib/ai/config";

const nav = [
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "New" },
];

export function AppHeader({
  email,
}: {
  email?: string | null;
}) {
  const mode = getDataMode();
  const aiOn = isAiEnabled();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FolderKanban aria-hidden />
            <span className="font-heading text-lg font-semibold tracking-tight">
              {getAppName()}
            </span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-4 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="secondary">
            {mode === "local" ? "Local" : "Supabase"}
          </Badge>
          <Badge variant={aiOn ? "default" : "outline"}>
            {aiOn ? "AI on" : "AI off"}
          </Badge>
          {email ? (
            <span className="hidden text-sm text-muted-foreground md:inline">
              {email}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
