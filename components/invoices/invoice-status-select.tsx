"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInvoiceStatus } from "@/actions/invoices";
import type { InvoiceStatus } from "@prisma/client";

const STATUSES: InvoiceStatus[] = ["ISSUED", "PAID", "OVERDUE", "CANCELLED"];

const LABEL: Record<InvoiceStatus, string> = {
  ISSUED: "הופקה",
  PAID: "שולמה",
  OVERDUE: "באיחור",
  CANCELLED: "בוטלה",
};

export function InvoiceStatusSelect({
  projectId,
  invoiceId,
  status,
}: {
  projectId: string;
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(value) =>
        startTransition(() => {
          updateInvoiceStatus(projectId, invoiceId, value as InvoiceStatus);
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
