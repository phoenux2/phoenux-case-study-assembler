import { ProjectList } from "@/components/projects/project-list";
import { SystemStatus } from "@/components/system-status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/auth/session";
import { getDataMode } from "@/lib/config";
import { listProjects } from "@/lib/services/projects";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  const projects = await listProjects(user.id);
  const mode = getDataMode();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Reconstruct projects into reusable case studies: collect evidence,
            answer adaptive questions, assemble blocks, then export.
          </p>
        </div>
        <SystemStatus />
      </div>

      {mode === "local" ? (
        <Alert>
          <AlertTitle>Running in local mode</AlertTitle>
          <AlertDescription>
            Supabase env vars are not set. Data is stored under{" "}
            <code className="font-mono text-xs">.data/</code>. Add{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to switch to Supabase.
          </AlertDescription>
        </Alert>
      ) : null}

      <ProjectList projects={projects} />
    </div>
  );
}
