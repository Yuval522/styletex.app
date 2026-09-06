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
          <Plus /> הוסף מפרט
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת מפרט ארון</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doorStyle">סגנון דלת</Label>
              <Input id="doorStyle" name="doorStyle" required placeholder="קלאסי" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="finish">גימור</Label>
              <Input id="finish" name="finish" required placeholder="לבן מאט" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="width">רוחב (אינץ&apos;)</Label>
              <Input id="width" name="width" type="number" step="0.1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="height">גובה (אינץ&apos;)</Label>
              <Input id="height" name="height" type="number" step="0.1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depth">עומק (אינץ&apos;)</Label>
              <Input id="depth" name="depth" type="number" step="0.1" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>חומר</Label>
            <input type="hidden" name="materialId" value={materialId} />
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר חומר (לא חובה)" />
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
            <Label htmlFor="hardware">אביזרים</Label>
            <Input id="hardware" name="hardware" placeholder="ידיות פליז מוברש" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" placeholder="צירי סופט-קלוז, מסגרת מותאמת אישית…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              הוסף מפרט
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
