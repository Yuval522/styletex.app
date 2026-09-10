"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateInvoicePaid } from "@/actions/invoices";

export function InvoicePaymentToggle({
  invoiceId,
  paid,
}: {
  invoiceId: string;
  paid: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await updateInvoicePaid(invoiceId, !paid);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={paid ? "outline" : "accent"}
      size="sm"
      disabled={isPending}
      onClick={toggle}
    >
      {paid ? <CheckCircle2 /> : <Circle />}
      {isPending ? "מעדכן…" : paid ? "שולם" : "סמן כשולם"}
    </Button>
  );
}
