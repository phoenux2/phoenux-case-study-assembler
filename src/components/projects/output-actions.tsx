"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PrinterIcon } from "lucide-react";

import { setApprovalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { ApprovalStatus } from "@/lib/db/types";

export function OutputActions({
  projectId,
  outputId,
  approval,
  showPrint,
}: {
  projectId: string;
  outputId: string;
  approval: ApprovalStatus;
  showPrint: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setApproval(next: ApprovalStatus) {
    startTransition(async () => {
      await setApprovalAction(projectId, "output", outputId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showPrint ? (
        <Button variant="outline" onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" />
          Print / Save PDF
        </Button>
      ) : null}
      {approval !== "approved" ? (
        <Button disabled={pending} onClick={() => setApproval("approved")}>
          {pending ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : null}
          Approve output
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setApproval("draft")}
        >
          Move to draft
        </Button>
      )}
    </div>
  );
}
