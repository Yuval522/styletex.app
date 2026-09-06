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
      <SelectTrigger className="h-8 w-[120px] text-xs capitalize" disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s.toLowerCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
