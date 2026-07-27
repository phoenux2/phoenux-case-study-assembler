"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import {
  runClaimReviewAction,
  runEditorialAction,
  runExtractionAction,
  runGapDetectionAction,
  runQuestionRefinementAction,
} from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Claim } from "@/lib/db/block-types";
import type { StructuredFactRecord } from "@/lib/db/ai-types";

type PipelineResult = {
  title: string;
  body: string;
  meta?: string;
};

export function AiPipelinePanel({
  projectId,
  aiEnabled,
  provider,
  facts,
  claims,
}: {
  projectId: string;
  aiEnabled: boolean;
  provider: string;
  facts: StructuredFactRecord[];
  claims: Claim[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(task: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await task();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pipeline task failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>AI pipeline</CardTitle>
            <CardDescription>
              Extraction, gaps, refinement, claim review, editorial — with
              deterministic fallbacks when AI is off.
            </CardDescription>
          </div>
          <Badge variant={aiEnabled ? "default" : "secondary"}>
            {aiEnabled ? `AI on (${provider})` : "AI disabled · deterministic"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Alert>
          <AlertTitle>Token rules</AlertTitle>
          <AlertDescription>
            AI receives summaries only, every request is cached, and the app stays
            usable with AI disabled.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending}
            onClick={() =>
              run(async () => {
                const response = await runExtractionAction(projectId);
                if (!response.ok) throw new Error(response.error);
                setResult({
                  title: "Extraction",
                  body: response.summary || "No facts extracted",
                  meta: response.meta,
                });
              })
            }
          >
            {pending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : null}
            Run extraction
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const response = await runGapDetectionAction(projectId);
                if (!response.ok) throw new Error(response.error);
                setResult({
                  title: "Gap detection",
                  body: response.summary || "No gaps",
                  meta: response.meta,
                });
              })
            }
          >
            Detect gaps
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const response = await runQuestionRefinementAction(projectId);
                if (!response.ok) throw new Error(response.error);
                setResult({
                  title: "Question refinement",
                  body: response.summary || "No questions",
                  meta: response.meta,
                });
              })
            }
          >
            Refine questions
          </Button>
          <Button
            variant="outline"
            disabled={pending || claims.length === 0}
            onClick={() =>
              run(async () => {
                const claimId = claims[0]?.id;
                if (!claimId) throw new Error("No claims to review");
                const response = await runClaimReviewAction(projectId, claimId);
                if (!response.ok) throw new Error(response.error);
                setResult({
                  title: "Claim review",
                  body: response.summary || "No verdict",
                  meta: response.meta,
                });
              })
            }
          >
            Review first claim
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const response = await runEditorialAction(projectId, "website");
                if (!response.ok) throw new Error(response.error);
                setResult({
                  title: "Editorial",
                  body: response.summary || "No sections",
                  meta: response.meta,
                });
              })
            }
          >
            Editorial (website)
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <div
            data-testid="pipeline-result"
            className="flex flex-col gap-2 rounded-lg border border-border p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{result.title} result</p>
              {result.meta ? (
                <Badge variant="outline">{result.meta}</Badge>
              ) : null}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
              {result.body}
            </pre>
          </div>
        ) : null}

        <div className="flex flex-col gap-2" data-testid="fact-list">
          <p className="text-sm font-medium">Structured facts</p>
          {facts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No facts yet. Run extraction on a source.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {facts.map((fact) => (
                <li
                  key={fact.id}
                  data-testid="fact-item"
                  className="flex flex-wrap items-center gap-2"
                >
                  <Badge variant="secondary">{fact.key}</Badge>
                  <span>{fact.value}</span>
                  <Badge variant="outline">{fact.provenance.method}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
