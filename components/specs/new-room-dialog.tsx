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
import { createRoom } from "@/actions/specs";

export function NewRoomDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const action = createRoom.bind(null, projectId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> הוסף חדר
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת חדר</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם החדר</Label>
            <Input id="name" name="name" required placeholder="מטבח" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              הוסף חדר
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
