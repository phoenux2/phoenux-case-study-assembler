"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";

import {
  createProjectAction,
  type ActionResult,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionResult | null = null;

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={state?.ok === false || undefined}>
          <FieldLabel htmlFor="title">Project title</FieldLabel>
          <Input
            id="title"
            name="title"
            placeholder="Acme checkout redesign"
            required
            aria-invalid={state?.ok === false || undefined}
          />
          <FieldDescription>
            Use the client or product name people will recognize in case studies.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="client_name">Client name</FieldLabel>
          <Input
            id="client_name"
            name="client_name"
            placeholder="Optional"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="summary">Summary</FieldLabel>
          <Textarea
            id="summary"
            name="summary"
            placeholder="What was this engagement about?"
            rows={4}
          />
        </Field>
      </FieldGroup>
      {state?.ok === false && state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
        Create project
      </Button>
    </form>
  );
}
