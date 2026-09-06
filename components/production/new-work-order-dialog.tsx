"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createWorkOrder } from "@/actions/work-orders";

export function NewWorkOrderDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const action = createWorkOrder.bind(null, projectId);

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
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assignedTo">שויך ל</Label>
            <Input id="assignedTo" name="assignedTo" placeholder="אחראי רצפת הייצור" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">תאריך יעד</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" placeholder="רשימת חיתוך, הוראות מיוחדות…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              צור הזמנת עבודה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
