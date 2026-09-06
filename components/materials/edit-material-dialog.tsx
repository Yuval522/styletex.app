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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMaterial } from "@/actions/materials";
import type { MaterialType } from "@prisma/client";

const TYPES: { value: MaterialType; label: string }[] = [
  { value: "WOOD", label: "עץ" },
  { value: "LAMINATE", label: "למינציה" },
  { value: "COUNTERTOP", label: "משטח עבודה" },
  { value: "HARDWARE", label: "אביזרים" },
  { value: "FINISH", label: "גימור" },
  { value: "OTHER", label: "אחר" },
];

export function EditMaterialDialog({
  material,
  suppliers,
}: {
  material: {
    id: string;
    name: string;
    type: MaterialType;
    unitCost: number | string;
    unit: string;
    stockQty: number | string | null;
    reorderLevel: number | string | null;
    supplierId: string | null;
  };
  suppliers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<MaterialType>(material.type);
  const [supplierId, setSupplierId] = useState(material.supplierId ?? "");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateMaterial(material.id, formData);
      router.refresh();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="ערוך חומר">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת חומר</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-material-name">שם</Label>
            <Input
              id="edit-material-name"
              name="name"
              required
              defaultValue={material.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סוג</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={(v) => setType(v as MaterialType)}>
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
              <Label htmlFor="edit-material-unit">יחידת מידה</Label>
              <Input
                id="edit-material-unit"
                name="unit"
                required
                defaultValue={material.unit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-material-cost">עלות ליחידה</Label>
              <Input
                id="edit-material-cost"
                name="unitCost"
                type="number"
                step="0.01"
                required
                defaultValue={String(material.unitCost)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-material-stock">כמות במלאי</Label>
              <Input
                id="edit-material-stock"
                name="stockQty"
                type="number"
                step="0.1"
                defaultValue={material.stockQty != null ? String(material.stockQty) : ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-material-reorder">רמת הזמנה חוזרת</Label>
            <Input
              id="edit-material-reorder"
              name="reorderLevel"
              type="number"
              step="0.1"
              defaultValue={material.reorderLevel != null ? String(material.reorderLevel) : ""}
            />
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
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "שומר…" : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
