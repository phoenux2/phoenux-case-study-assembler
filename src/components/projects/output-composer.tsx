"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { toast } from "sonner";

import { updateOutputLayoutAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { reorderSlots, sortSlots, updateSlot } from "@/lib/blocks/layout";
import type {
  ContentBlock,
  OutputLayout,
  OutputLayoutSlot,
} from "@/lib/db/block-types";
import { cn } from "@/lib/utils";

function SortableSlotRow({
  slot,
  block,
  disabled,
  onToggle,
  onEdit,
}: {
  slot: OutputLayoutSlot;
  block: ContentBlock | undefined;
  disabled: boolean;
  onToggle: (included: boolean) => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const preview =
    slot.override_text?.trim() ||
    block?.body.text ||
    block?.body.metric ||
    "Empty block";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-background p-3",
        !slot.included && "opacity-50",
        isDragging && "z-10 shadow-md",
      )}
    >
      <button
        type="button"
        className="mt-1 touch-none text-muted-foreground hover:text-foreground disabled:opacity-40"
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>

      <div className="mt-1">
        <Checkbox
          checked={slot.included}
          disabled={disabled}
          onCheckedChange={(checked) => onToggle(checked)}
          aria-label="Include in output"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">
            {slot.override_heading?.trim() ||
              block?.title ||
              block?.block_type ||
              "Missing block"}
          </p>
          {block ? (
            <Badge variant="secondary">{block.block_type}</Badge>
          ) : (
            <Badge variant="destructive">missing</Badge>
          )}
          {!slot.included ? (
            <Badge variant="outline">excluded</Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={onEdit}
        aria-label="Edit slot copy"
      >
        <PencilIcon />
      </Button>
    </div>
  );
}

export function OutputComposer({
  projectId,
  outputId,
  layout: initialLayout,
  blocks,
  locked,
}: {
  projectId: string;
  outputId: string;
  layout: OutputLayout;
  blocks: ContentBlock[];
  locked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [layout, setLayout] = useState(initialLayout);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftHeading, setDraftHeading] = useState("");
  const [draftText, setDraftText] = useState("");

  const blocksById = useMemo(
    () => new Map(blocks.map((block) => [block.id, block])),
    [blocks],
  );
  const ordered = sortSlots(layout.slots);
  const editing = ordered.find((slot) => slot.id === editingId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function persist(next: OutputLayout) {
    setLayout(next);
    startTransition(async () => {
      const result = await updateOutputLayoutAction(
        projectId,
        outputId,
        next,
      );
      if (!result.ok) {
        toast.error(result.error || "Could not save layout");
        setLayout(initialLayout);
        return;
      }
      toast.success("Layout saved — output moved to draft");
      router.refresh();
    });
  }

  function onDragEnd(event: DragEndEvent) {
    if (locked || pending) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = ordered.map((slot) => slot.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    persist({
      ...layout,
      slots: reorderSlots(layout.slots, nextIds),
    });
  }

  function openEditor(slot: OutputLayoutSlot) {
    const block = blocksById.get(slot.block_id);
    setEditingId(slot.id);
    setDraftHeading(
      slot.override_heading ?? block?.title ?? block?.block_type ?? "",
    );
    setDraftText(
      slot.override_text ?? block?.body.text ?? block?.body.metric ?? "",
    );
  }

  function saveEditor() {
    if (!editingId) return;
    const next = updateSlot(layout, editingId, {
      override_heading: draftHeading.trim() || null,
      override_text: draftText.trim() || null,
    });
    setEditingId(null);
    persist(next);
  }

  if (locked) {
    return (
      <p className="text-sm text-muted-foreground">
        Output is approved. Move it back to draft to reorder or edit slots.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">Compose layout</h2>
        <p className="text-sm text-muted-foreground">
          Drag to reorder, toggle inclusion, polish copy. Blocks stay the
          source of truth — no new facts.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={ordered.map((slot) => slot.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {ordered.map((slot) => (
              <SortableSlotRow
                key={slot.id}
                slot={slot}
                block={blocksById.get(slot.block_id)}
                disabled={pending}
                onToggle={(included) =>
                  persist(updateSlot(layout, slot.id, { included }))
                }
                onEdit={() => openEditor(slot)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {pending ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Saving layout…
        </p>
      ) : null}

      <Sheet
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <SheetContent className="flex flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Polish slot copy</SheetTitle>
            <SheetDescription>
              Light wording only. This slot remains linked to its approved
              block for provenance.
            </SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4">
            <Field>
              <FieldLabel htmlFor="slot-heading">Heading</FieldLabel>
              <Input
                id="slot-heading"
                value={draftHeading}
                onChange={(event) => setDraftHeading(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="slot-body">Body</FieldLabel>
              <Textarea
                id="slot-body"
                rows={8}
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setEditingId(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={saveEditor} disabled={pending}>
              {pending ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : null}
              Save polish
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
