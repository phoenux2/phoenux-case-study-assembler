"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";

import {
  addTextSourceAction,
  uploadFileAction,
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

export function AddTextSourceForm({ projectId }: { projectId: string }) {
  const action = addTextSourceAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="text-title">Note title</FieldLabel>
          <Input id="text-title" name="title" required placeholder="Kickoff notes" />
        </Field>
        <Field>
          <FieldLabel htmlFor="content_text">Content</FieldLabel>
          <Textarea
            id="content_text"
            name="content_text"
            required
            rows={6}
            placeholder="Paste proposal excerpts, email threads, or meeting notes."
          />
          <FieldDescription>
            Stored as a source with a deterministic summary — no AI yet.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {state?.ok === false && state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">Source saved.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
        Add text source
      </Button>
    </form>
  );
}

export function UploadFileForm({ projectId }: { projectId: string }) {
  const action = uploadFileAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="file-title">Asset title</FieldLabel>
          <Input
            id="file-title"
            name="title"
            placeholder="Defaults to filename"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="file">File</FieldLabel>
          <Input id="file" name="file" type="file" required />
          <FieldDescription>
            Images become reusable assets. Other files become sources only.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {state?.ok === false && state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">Upload saved.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
        Upload file
      </Button>
    </form>
  );
}
