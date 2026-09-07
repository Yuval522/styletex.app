"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import { createQuote } from "@/actions/quotes";

type LineItem = { id: number; description: string; quantity: string; unitPrice: string };
type ProjectOption = { id: string; name: string; client: { name: string } };

const EMPTY_ITEM: LineItem = { id: 1, description: "", quantity: "1", unitPrice: "" };

/**
 * Used two ways: pinned to a known project (from the project detail page,
 * pass `projectId`) or standalone (from the Quotes tracking page, pass
 * `projects` and the user picks one from a dropdown first).
 */
export function NewQuoteDialog({
  projectId,
  projects,
}: {
  projectId?: string;
  projects?: ProjectOption[];
}) {
  const needsProjectPicker = !projectId;
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedProjectId) return;
    setPending(true);
    try {
      await createQuote(selectedProjectId, formData);
      router.refresh();
      setOpen(false);
      setItems([{ ...EMPTY_ITEM }]);
      if (needsProjectPicker) setSelectedProjectId("");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="sm">
          <Plus /> הצעת מחיר חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>הצעת מחיר חדשה</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {needsProjectPicker && (
            <div className="space-y-1.5">
              <Label>פרויקט</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
                <div className="w-full space-y-1.5 sm:w-auto sm:flex-1">
                  {item.id === items[0].id && <Label>תיאור</Label>}
                  <Input name="description" defaultValue={item.description} placeholder="ארון אי מותאם אישית" />
                </div>
                <div className="w-[calc(50%-2.25rem)] space-y-1.5 sm:w-20">
                  {item.id === items[0].id && <Label>כמות</Label>}
                  <Input name="quantity" type="number" step="0.1" defaultValue={item.quantity} />
                </div>
                <div className="w-[calc(50%-2.25rem)] space-y-1.5 sm:w-28">
                  {item.id === items[0].id && <Label>מחיר יחידה</Label>}
                  <Input name="unitPrice" type="number" step="0.01" defaultValue={item.unitPrice} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus /> הוסף שורה
          </Button>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tax">מע&quot;מ</Label>
              <Input id="tax" name="tax" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdf">קובץ הצעת מחיר (PDF, לא חובה)</Label>
              <input
                id="pdf"
                name="pdf"
                type="file"
                accept="application/pdf"
                className="block w-full text-sm text-muted-foreground file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-border/60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending || !selectedProjectId}>
              {pending ? "יוצר…" : "צור הצעת מחיר"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
