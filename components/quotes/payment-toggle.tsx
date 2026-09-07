"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateQuotePaid } from "@/actions/quotes";

export function PaymentToggle({
  quoteId,
  paid,
}: {
  quoteId: string;
  paid: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await updateQuotePaid(quoteId, !paid);
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
