"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";

import {
  answerQuestionAction,
  type ActionResult,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { Asset } from "@/lib/db/types";
import type { CoverageSnapshot, Question } from "@/lib/db/question-types";

const initial: ActionResult | null = null;

export function QuestionEnginePanel({
  projectId,
  coverage,
  assets,
}: {
  projectId: string;
  coverage: CoverageSnapshot;
  assets: Asset[];
}) {
  const question = coverage.next_question;
  const percent = Math.round(coverage.score * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Next question</CardTitle>
            <CardDescription>
              Adaptive coverage — one question at a time, no AI.
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {coverage.answered}/{coverage.total} covered
          </Badge>
        </div>
        <Progress value={percent} className="mt-4">
          <ProgressLabel>Coverage</ProgressLabel>
          <ProgressValue />
        </Progress>
      </CardHeader>
      <CardContent>
        {!question ? (
          <Alert>
            <AlertTitle>Coverage complete for now</AlertTitle>
            <AlertDescription>
              Applicable Phase 1 questions are answered. Upload more evidence or
              wait for Phase 2 content blocks.
            </AlertDescription>
          </Alert>
        ) : (
          <AnswerQuestionForm
            projectId={projectId}
            question={question}
            assets={assets}
          />
        )}
      </CardContent>
    </Card>
  );
}

function AnswerQuestionForm({
  projectId,
  question,
  assets,
}: {
  projectId: string;
  question: Question;
  assets: Asset[];
}) {
  const action = answerQuestionAction.bind(null, projectId, question.id);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-heading text-lg font-medium">{question.prompt}</p>
        {question.why ? (
          <p className="text-sm text-muted-foreground">
            Why this question: {question.why}
          </p>
        ) : null}
        <Badge variant="outline" className="w-fit">
          {question.question_type}
        </Badge>
      </div>

      <FieldGroup>{renderFields(question, assets)}</FieldGroup>

      {state?.ok === false && state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : null}
        Save answer
      </Button>
    </form>
  );
}

function renderFields(question: Question, assets: Asset[]) {
  switch (question.question_type) {
    case "boolean":
      return (
        <Field>
          <FieldLabel>Answer</FieldLabel>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="boolean" value="true" required />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="boolean" value="false" required />
              No
            </label>
          </div>
        </Field>
      );
    case "single_select":
    case "confidence":
    case "permission":
      return (
        <Field>
          <FieldLabel>Choose one</FieldLabel>
          <div className="flex flex-col gap-2">
            {(question.options.length
              ? question.options
              : [
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]
            ).map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="selected"
                  value={option.value}
                  required
                />
                {option.label}
              </label>
            ))}
          </div>
        </Field>
      );
    case "multiple_select":
      return (
        <Field>
          <FieldLabel>Choose all that apply</FieldLabel>
          <div className="flex flex-col gap-2">
            {question.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-sm"
              >
                <input type="checkbox" name="selected" value={option.value} />
                {option.label}
              </label>
            ))}
          </div>
        </Field>
      );
    case "short_text":
    case "number":
      return (
        <Field>
          <FieldLabel htmlFor="answer-text">Answer</FieldLabel>
          <Input
            id="answer-text"
            name="text"
            type={question.question_type === "number" ? "number" : "text"}
            required
          />
        </Field>
      );
    case "long_text":
      return (
        <Field>
          <FieldLabel htmlFor="answer-text">Answer</FieldLabel>
          <Textarea id="answer-text" name="text" rows={5} required />
        </Field>
      );
    case "asset_selection":
      return (
        <AssetSelectField
          name="asset_id"
          label="Image asset"
          assets={assets}
          required
        />
      );
    case "text_image":
      return (
        <>
          <AssetSelectField
            name="asset_id"
            label="Related image"
            assets={assets}
            required
          />
          <Field>
            <FieldLabel htmlFor="answer-text">Explanation</FieldLabel>
            <Textarea id="answer-text" name="text" rows={4} required />
          </Field>
        </>
      );
    case "before_after":
      return (
        <>
          <AssetSelectField
            name="before_asset_id"
            label="Before image"
            assets={assets}
            required
          />
          <AssetSelectField
            name="after_asset_id"
            label="After image"
            assets={assets}
            required
          />
          <Field>
            <FieldLabel htmlFor="answer-text">What changed?</FieldLabel>
            <Textarea id="answer-text" name="text" rows={3} />
            <FieldDescription>Optional context for the pair.</FieldDescription>
          </Field>
        </>
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unsupported question type.
        </p>
      );
  }
}

function AssetSelectField({
  name,
  label,
  assets,
  required,
}: {
  name: string;
  label: string;
  assets: Asset[];
  required?: boolean;
}) {
  if (assets.length === 0) {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>
          Upload an image asset first, then return to this question.
        </FieldDescription>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {assets.map((asset) => {
          const preview =
            asset.storage_path &&
            (asset.storage_path.startsWith("http://") ||
              asset.storage_path.startsWith("https://") ||
              asset.storage_path.startsWith("data:"))
              ? asset.storage_path
              : `/api/assets/${asset.id}`;

          return (
            <label
              key={asset.id}
              className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-input has-[:checked]:border-ring has-[:checked]:ring-3 has-[:checked]:ring-ring/40"
            >
              <input
                type="radio"
                name={name}
                value={asset.id}
                required={required}
                className="sr-only"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={asset.caption || asset.title}
                className="h-28 w-full object-cover bg-muted"
              />
              <span className="flex flex-col gap-0.5 p-3">
                <span className="text-sm font-medium leading-tight">
                  {asset.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {asset.filename || asset.category || "Image asset"}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}
