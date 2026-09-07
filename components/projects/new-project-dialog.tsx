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
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/actions/projects";

export function NewProjectDialog({
  clients,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Plus /> פרויקט חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>פרויקט חדש</DialogTitle>
        </DialogHeader>
        <form action={createProject} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם הפרויקט</Label>
            <Input id="name" name="name" required placeholder="דירת כהן — מטבח" />
          </div>

          <div className="space-y-1.5">
            <Label>לקוח</Label>
            <input type="hidden" name="clientId" value={clientId} />
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="budget">תקציב</Label>
              <Input id="budget" name="budget" type="number" placeholder="45000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetDate">תאריך יעד</Label>
              <DateInput id="targetDate" name="targetDate" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={!clientId}>
              צור פרויקט
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
