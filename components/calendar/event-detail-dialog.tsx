"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { updateCalendarEvent, deleteCalendarEvent } from "@/actions/calendar-events";
import { EVENT_TYPES, EVENT_TYPE_LABEL, type CalendarEventWithProject } from "./event-meta";

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function EventDetailDialog({
  event,
  projects,
  onClose,
}: {
  event: CalendarEventWithProject | null;
  projects: { id: string; name: string; client: { name: string } }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [type, setType] = useState(event?.type ?? "OTHER");
  const [projectId, setProjectId] = useState(event?.projectId ?? "");

  if (!event) return null;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateCalendarEvent(event!.id, formData);
      router.refresh();
      onClose();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (typeof window !== "undefined" && !window.confirm("למחוק אירוע זה? הפעולה אינה הפיכה.")) {
      return;
    }
    setPending(true);
    try {
      await deleteCalendarEvent(event!.id);
      router.refresh();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={!!event}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת אירוע</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="allDay" value="true" />
          <div className="space-y-1.5">
            <Label htmlFor="title">כותרת</Label>
            <Input id="title" name="title" required defaultValue={event.title} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>סוג אירוע</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startAt">תאריך התחלה</Label>
              <DateInput
                id="startAt"
                name="startAt"
                required
                defaultValue={toDateInputValue(event.startAt)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">תאריך סיום (לא חובה)</Label>
              <DateInput
                id="endAt"
                name="endAt"
                defaultValue={event.endAt ? toDateInputValue(event.endAt) : undefined}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" defaultValue={event.notes ?? ""} />
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 /> מחק אירוע
            </Button>
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "שומר…" : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
