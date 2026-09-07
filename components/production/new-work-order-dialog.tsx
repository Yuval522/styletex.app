"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWorkOrder } from "@/actions/work-orders";
import { STAGE_LABEL } from "@/components/shared/status-badge";
import type { ProductionStage } from "@prisma/client";

const STAGES: ProductionStage[] = ["CUTTING", "ASSEMBLY", "FINISHING", "QC", "READY"];

type ProjectOption = { id: string; name: string; client: { name: string } };

/**
 * Used two ways: pinned to a known project (from the project detail
 * page, pass `projectId`) or standalone (from the Production page, pass
 * `projects` and the user picks one from a dropdown first).
 */
export function NewWorkOrderDialog({
  projectId,
  projects,
}: {
  projectId?: string;
  projects?: ProjectOption[];
}) {
  const needsProjectPicker = !projectId;
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [stage, setStage] = useState<ProductionStage>("CUTTING");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (!selectedProjectId) return;
    setPending(true);
    try {
      await createWorkOrder(selectedProjectId, formData);
      router.refresh();
      setOpen(false);
      setStage("CUTTING");
      if (needsProjectPicker) setSelectedProjectId("");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="sm">
          <Plus /> הזמנת עבודה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הזמנת עבודה חדשה</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {needsProjectPicker && (
            <div className="space-y-1.5">
              <Label>פרויקט</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignedTo">שויך ל</Label>
              <Input id="assignedTo" name="assignedTo" placeholder="אחראי רצפת הייצור" />
            </div>
            <div className="space-y-1.5">
              <Label>שלב ייצור</Label>
              <input type="hidden" name="stage" value={stage} />
              <Select value={stage} onValueChange={(v) => setStage(v as ProductionStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">תאריך יעד</Label>
            <DateInput id="dueDate" name="dueDate" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" placeholder="רשימת חיתוך, הוראות מיוחדות…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending || !selectedProjectId}>
              {pending ? "יוצר…" : "צור הזמנת עבודה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
