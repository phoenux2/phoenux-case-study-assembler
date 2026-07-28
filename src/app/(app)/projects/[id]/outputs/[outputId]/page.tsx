import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OutputActions } from "@/components/projects/output-actions";
import { OutputComposer } from "@/components/projects/output-composer";
import { getSessionUser } from "@/lib/auth/session";
import { getProject } from "@/lib/services/projects";
import { getOutput, resolveOutputLayout } from "@/lib/services/outputs";
import { listContentBlocks } from "@/lib/services/blocks";
import { listAssets } from "@/lib/services/assets";

function canPreviewAsset(storagePath: string | null): boolean {
  if (!storagePath) return false;
  return (
    storagePath.startsWith("http://") ||
    storagePath.startsWith("https://") ||
    storagePath.startsWith("data:")
  );
}

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

  const blocks = await listContentBlocks(project.id);
  const assets = await listAssets(project.id);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const layout = resolveOutputLayout(output);
  const isPdf = output.output_type === "pdf";
  const locked = output.approval === "approved";

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
            Assembled from Q&amp;A blocks. Reorder and polish below — provenance
            stays linked.
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

      <div className="print:hidden">
        <OutputComposer
          projectId={project.id}
          outputId={output.id}
          layout={layout}
          blocks={blocks}
          locked={locked}
        />
      </div>

      <Separator className="print:hidden" />

      <article
        className={`flex flex-col gap-8 ${isPdf ? "print:gap-10" : ""}`}
      >
        <header className="hidden print:block">
          <h1 className="font-heading text-3xl font-semibold">
            {output.payload.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Phoenux Case Study Assembler · {output.output_type}
          </p>
        </header>

        <h2 className="font-heading text-lg font-semibold print:hidden">
          Preview
        </h2>

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
              {section.asset_ids?.length ? (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {section.asset_ids.map((assetId) => {
                    const asset = assetsById.get(assetId);
                    if (!asset) {
                      return (
                        <div
                          key={assetId}
                          className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground"
                        >
                          Linked image not found ({assetId.slice(0, 8)}…).
                        </div>
                      );
                    }

                    return (
                      <figure
                        key={asset.id}
                        className="overflow-hidden rounded-lg border border-border"
                      >
                        {canPreviewAsset(asset.storage_path) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.storage_path!}
                            alt={asset.caption || asset.title}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-muted px-4 text-center text-xs text-muted-foreground">
                            Image linked but preview unavailable in this mode.
                          </div>
                        )}
                        <figcaption className="space-y-1 p-3">
                          <p className="text-sm font-medium leading-tight">
                            {asset.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.caption || asset.description || "No caption"}
                          </p>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ) : null}
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
