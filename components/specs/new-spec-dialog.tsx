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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCabinetSpec } from "@/actions/specs";

export function NewSpecDialog({
  projectId,
  roomId,
  materials,
}: {
  projectId: string;
  roomId: string;
  materials: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [materialId, setMaterialId] = useState<string>("");
  const action = createCabinetSpec.bind(null, projectId, roomId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus /> Add spec
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add cabinet spec</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doorStyle">Door style</Label>
              <Input id="doorStyle" name="doorStyle" required placeholder="Shaker" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="finish">Finish</Label>
              <Input id="finish" name="finish" required placeholder="Matte white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="width">Width (in)</Label>
              <Input id="width" name="width" type="number" step="0.1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="height">Height (in)</Label>
              <Input id="height" name="height" type="number" step="0.1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depth">Depth (in)</Label>
              <Input id="depth" name="depth" type="number" step="0.1" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Material</Label>
            <input type="hidden" name="materialId" value={materialId} />
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a material (optional)" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hardware">Hardware</Label>
            <Input id="hardware" name="hardware" placeholder="Brushed brass pulls" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Soft-close hinges, custom inset…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              Add spec
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
