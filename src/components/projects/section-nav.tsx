import Link from "next/link";

export function ProjectSectionNav({ projectId }: { projectId: string }) {
  const items = [
    { href: `#questions`, label: "Questions" },
    { href: `#assembly`, label: "Blocks & outputs" },
    { href: `#ai-pipeline`, label: "AI pipeline" },
    { href: `#phase4`, label: "Vision & knowledge" },
    { href: `#sources`, label: "Sources" },
    { href: `#assets`, label: "Assets" },
  ];

  return (
    <nav
      aria-label="Project sections"
      className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur"
    >
      <div className="flex gap-2 overflow-x-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={`/projects/${projectId}${item.href}`}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
