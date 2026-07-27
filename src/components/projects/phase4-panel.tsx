"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import {
  analyzeVisionAction,
  importFigmaAction,
  rebuildKnowledgeAction,
  searchKnowledgeAction,
  type ActionResult,
  type PipelineActionResult,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Asset } from "@/lib/db/types";
import type { KnowledgeEntry, RetrievalHit } from "@/lib/db/phase4-types";

const initial: ActionResult | null = null;

export function Phase4Panel({
  projectId,
  assets,
  knowledge,
  figmaConfigured,
}: {
  projectId: string;
  assets: Asset[];
  knowledge: KnowledgeEntry[];
  figmaConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visionNote, setVisionNote] = useState<string | null>(null);
  const [hits, setHits] = useState<RetrievalHit[]>([]);
  const [searchMeta, setSearchMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const figmaAction = importFigmaAction.bind(null, projectId);
  const [figmaState, figmaFormAction, figmaPending] = useActionState(
    figmaAction,
    initial,
  );

  function runVision(assetId: string) {
    setError(null);
    startTransition(async () => {
      const result = await analyzeVisionAction(projectId, assetId);
      if (!result.ok) {
        setError(result.error || "Vision failed");
        return;
      }
      setVisionNote(result.summary || "Vision complete");
      router.refresh();
    });
  }

  function rebuild() {
    setError(null);
    startTransition(async () => {
      const result = await rebuildKnowledgeAction(projectId);
      if (!result.ok) {
        setError(result.error || "Knowledge rebuild failed");
        return;
      }
      setSearchMeta(result.summary || "Knowledge rebuilt");
      router.refresh();
    });
  }

  function search(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const query = String(formData.get("query") || "");
      const result = (await searchKnowledgeAction(
        projectId,
        query,
      )) as PipelineActionResult & { hits?: RetrievalHit[] };
      if (!result.ok) {
        setError(result.error || "Search failed");
        return;
      }
      setHits(result.hits || []);
      setSearchMeta(result.meta || result.summary || null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Vision · Figma · Knowledge</CardTitle>
            <CardDescription>
              On-demand vision only. Figma import and project retrieval stay
              deterministic unless tokens are configured.
            </CardDescription>
          </div>
          <Badge variant={figmaConfigured ? "default" : "secondary"}>
            {figmaConfigured ? "Figma API configured" : "Figma stub mode"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-base font-semibold">
            On-demand vision
          </h3>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload an image or import Figma frames first.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {assets.slice(0, 6).map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{asset.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.category || "uncategorized"} · {asset.phase}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => runVision(asset.id)}
                  >
                    {pending ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : null}
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          )}
          {visionNote ? (
            <pre
              data-testid="vision-result"
              className="whitespace-pre-wrap rounded-lg border border-border p-3 text-sm text-muted-foreground"
            >
              {visionNote}
            </pre>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-base font-semibold">Figma import</h3>
          <form action={figmaFormAction} className="flex flex-col gap-3">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="figma_url">File URL or key</FieldLabel>
                <Input
                  id="figma_url"
                  name="figma_url"
                  placeholder="https://www.figma.com/design/ABC123/..."
                  required
                />
                <FieldDescription>
                  Without FIGMA_ACCESS_TOKEN, imports a deterministic frame stub
                  and creates reusable assets.
                </FieldDescription>
              </Field>
            </FieldGroup>
            {figmaState?.ok === false && figmaState.error ? (
              <p className="text-sm text-destructive" role="alert">
                {figmaState.error}
              </p>
            ) : null}
            {figmaState?.ok ? (
              <p className="text-sm text-muted-foreground">Figma import saved.</p>
            ) : null}
            <Button type="submit" disabled={figmaPending || pending}>
              {figmaPending ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : null}
              Import Figma
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-base font-semibold">
              Knowledge base
            </h3>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={rebuild}
            >
              Rebuild index
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {knowledge.length} entr
            {knowledge.length === 1 ? "y" : "ies"} indexed from facts, sources,
            assets, blocks, and claims.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              search(new FormData(event.currentTarget));
            }}
            className="flex flex-col gap-3"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="query">Retrieve</FieldLabel>
                <Input
                  id="query"
                  name="query"
                  placeholder="onboarding problem dashboard"
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : null}
              Search knowledge
            </Button>
          </form>
          {searchMeta ? (
            <p className="text-xs text-muted-foreground">{searchMeta}</p>
          ) : null}
          {hits.length > 0 ? (
            <ul data-testid="retrieval-hits" className="flex flex-col gap-2">
              {hits.map((hit) => (
                <li
                  key={hit.entry_id}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{hit.kind}</Badge>
                    <span className="font-medium">{hit.title}</span>
                    <Badge variant="outline">{hit.score}</Badge>
                  </div>
                  <p className="text-muted-foreground">{hit.snippet}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
