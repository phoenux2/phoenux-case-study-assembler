import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSessionUser } from "@/lib/auth/session";
import { getProject } from "@/lib/services/projects";
import { getOutput } from "@/lib/services/outputs";
import { OutputActions } from "@/components/projects/output-actions";

export default async function OutputDetailPage({
  params,
}: {
  params: Promise<{ id: string; outputId: string }>;
}) {
  const { id, outputId } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const project = await getProject(id, user.id);
  if (!project) notFound();

  const output = await getOutput(outputId, project.id);
  if (!output) notFound();

  const isPdf = output.output_type === "pdf";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {output.payload.title}
            </h1>
            <Badge variant="secondary">{output.output_type}</Badge>
            <Badge variant="outline">{output.approval}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Assembled from approved blocks only. No new facts were introduced.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<Link href={`/projects/${project.id}`} />}
            nativeButton={false}
          >
            Back to project
          </Button>
          <OutputActions
            projectId={project.id}
            outputId={output.id}
            approval={output.approval}
            showPrint={isPdf || output.output_type === "website"}
          />
        </div>
      </div>

      {output.payload.warnings.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground print:hidden">
          {output.payload.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <article
        className={`flex flex-col gap-8 ${
          isPdf ? "print:gap-10" : ""
        }`}
      >
        <header className="hidden print:block">
          <h1 className="font-heading text-3xl font-semibold">
            {output.payload.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Phoenux Case Study Assembler · {output.output_type}
          </p>
        </header>

        {output.payload.slides?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {output.payload.slides.map((slide, index) => (
              <section
                key={`${slide.title}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-border p-4 print:break-inside-avoid"
              >
                <h2 className="font-heading text-lg font-semibold">
                  {slide.title}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {slide.body || "—"}
                </p>
              </section>
            ))}
          </div>
        ) : (
          output.payload.sections.map((section, index) => (
            <section
              key={`${section.heading}-${index}`}
              className="flex flex-col gap-2 print:break-inside-avoid"
            >
              <h2 className="font-heading text-xl font-semibold">
                {section.heading}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {section.body || "—"}
              </p>
              {index < output.payload.sections.length - 1 ? (
                <Separator className="mt-4 print:hidden" />
              ) : null}
            </section>
          ))
        )}
      </article>
    </div>
  );
}
