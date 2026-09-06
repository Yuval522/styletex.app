"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkOrderStage } from "@/actions/work-orders";
import type { ProductionStage } from "@prisma/client";

const STAGES: ProductionStage[] = ["CUTTING", "ASSEMBLY", "FINISHING", "QC", "READY"];
const LABEL: Record<ProductionStage, string> = {
  CUTTING: "חיתוך",
  ASSEMBLY: "הרכבה",
  FINISHING: "גימור",
  QC: "בקרת איכות",
  READY: "מוכן",
};

export function StageSelect({
  workOrderId,
  stage,
}: {
  workOrderId: string;
  stage: ProductionStage;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={stage}
      onValueChange={(value) =>
        startTransition(() => {
          updateWorkOrderStage(workOrderId, value as ProductionStage);
        })
      }
    >
      <SelectTrigger className="h-8 w-[140px] text-xs" disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map((s) => (
          <SelectItem key={s} value={s}>
            {LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
