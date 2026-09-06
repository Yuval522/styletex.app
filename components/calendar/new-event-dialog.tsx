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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCalendarEvent } from "@/actions/calendar-events";
import { EVENT_TYPES, EVENT_TYPE_LABEL } from "./event-meta";

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function NewEventDialog({
  projects,
  defaultDate,
  trigger,
}: {
  projects: { id: string; name: string; client: { name: string } }[];
  defaultDate?: Date;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("OTHER");
  const [projectId, setProjectId] = useState("");
  const [pending, setPending] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setType("OTHER");
      setProjectId("");
    }
    setOpen(next);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createCalendarEvent(formData);
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="accent" size="sm">
            <Plus /> אירוע חדש
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>אירוע חדש</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="allDay" value="true" />
          <div className="space-y-1.5">
            <Label htmlFor="title">כותרת</Label>
            <Input id="title" name="title" required placeholder="מדידה בדירת כהן" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סוג אירוע</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>פרויקט</Label>
              <input type="hidden" name="projectId" value={projectId} />
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="ללא שיוך" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startAt">תאריך התחלה</Label>
              <Input
                id="startAt"
                name="startAt"
                type="date"
                required
                defaultValue={defaultDate ? toDateInputValue(defaultDate) : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">תאריך סיום (לא חובה)</Label>
              <Input id="endAt" name="endAt" type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" placeholder="פרטים נוספים…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "יוצר…" : "צור אירוע"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
