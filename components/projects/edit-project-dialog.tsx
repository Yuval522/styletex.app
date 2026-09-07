"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { updateProject } from "@/actions/projects";

function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function EditProjectDialog({
  project,
}: {
  project: {
    id: string;
    name: string;
    budget: number | string | null;
    startDate: Date | string | null;
    targetDate: Date | string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateProject(project.id, formData);
      router.refresh();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> עריכה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת פרויקט</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-project-name">שם הפרויקט</Label>
            <Input
              id="edit-project-name"
              name="name"
              required
              defaultValue={project.name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-project-budget">תקציב</Label>
            <Input
              id="edit-project-budget"
              name="budget"
              type="number"
              step="0.01"
              defaultValue={project.budget != null ? String(project.budget) : ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-start">תאריך התחלה</Label>
              <DateInput
                id="edit-project-start"
                name="startDate"
                defaultValue={toDateInputValue(project.startDate)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-project-target">תאריך יעד</Label>
              <DateInput
                id="edit-project-target"
                name="targetDate"
                defaultValue={toDateInputValue(project.targetDate)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "שומר…" : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
