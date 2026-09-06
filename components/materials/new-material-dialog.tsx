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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMaterial } from "@/actions/materials";

const TYPES = [
  { value: "WOOD", label: "עץ" },
  { value: "LAMINATE", label: "למינציה" },
  { value: "COUNTERTOP", label: "משטח עבודה" },
  { value: "HARDWARE", label: "אביזרים" },
  { value: "FINISH", label: "גימור" },
  { value: "OTHER", label: "אחר" },
];

export function NewMaterialDialog({
  suppliers,
}: {
  suppliers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("WOOD");
  const [supplierId, setSupplierId] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="sm">
          <Plus /> חומר חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>חומר חדש</DialogTitle>
        </DialogHeader>
        <form action={createMaterial} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input id="name" name="name" required placeholder="פורניר אלון לבן" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סוג</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">יחידת מידה</Label>
              <Input id="unit" name="unit" required placeholder="מ&quot;ר" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">עלות ליחידה</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockQty">כמות במלאי</Label>
              <Input id="stockQty" name="stockQty" type="number" step="0.1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ספק</Label>
            <input type="hidden" name="supplierId" value={supplierId} />
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר ספק (לא חובה)" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              הוסף חומר
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
