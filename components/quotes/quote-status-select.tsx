"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateQuoteStatus } from "@/actions/quotes";
import type { QuoteStatus } from "@prisma/client";

const STATUSES: QuoteStatus[] = ["DRAFT", "SENT", "APPROVED", "REJECTED"];

const LABEL: Record<QuoteStatus, string> = {
  DRAFT: "טיוטה",
  SENT: "נשלח",
  APPROVED: "אושר",
  REJECTED: "נדחה",
};

export function QuoteStatusSelect({
  projectId,
  quoteId,
  status,
}: {
  projectId: string;
  quoteId: string;
  status: QuoteStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(value) =>
        startTransition(() => {
          updateQuoteStatus(projectId, quoteId, value as QuoteStatus);
        })
      }
    >
      <SelectTrigger className="h-9 w-[120px] text-xs" disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
