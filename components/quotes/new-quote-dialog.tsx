"use client";

import { useState } from "react";
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
import { createQuote } from "@/actions/quotes";

type LineItem = { id: number; description: string; quantity: string; unitPrice: string };

export function NewQuoteDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", unitPrice: "" },
  ]);
  const action = createQuote.bind(null, projectId);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  {item.id === items[0].id && <Label>תיאור</Label>}
                  <Input name="description" defaultValue={item.description} placeholder="ארון אי מותאם אישית" />
                </div>
                <div className="w-20 space-y-1.5">
                  {item.id === items[0].id && <Label>כמות</Label>}
                  <Input name="quantity" type="number" step="0.1" defaultValue={item.quantity} />
                </div>
                <div className="w-28 space-y-1.5">
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

          <div className="w-40 space-y-1.5">
            <Label htmlFor="tax">מע&quot;מ</Label>
            <Input id="tax" name="tax" type="number" step="0.01" defaultValue="0" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              צור הצעת מחיר
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
