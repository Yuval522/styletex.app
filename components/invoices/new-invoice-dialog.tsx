"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileScan, Plus, Trash2 } from "lucide-react";
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
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice, parseInvoicePdf } from "@/actions/invoices";

type LineItem = { id: number; description: string; quantity: string; unitPrice: string };
type ProjectOption = { id: string; name: string; client: { name: string } };

const EMPTY_ITEM: LineItem = { id: 1, description: "", quantity: "1", unitPrice: "" };

/**
 * Used two ways: pinned to a known project (from the project detail page,
 * pass `projectId`) or standalone (from the tracking page, pass `projects`
 * and the user picks one from a dropdown first). Mirrors NewQuoteDialog —
 * see components/quotes/new-quote-dialog.tsx.
 */
export function NewInvoiceDialog({
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
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [number, setNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setParseMessage(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setParseMessage(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseMessage(
        "הקובץ גדול מדי לניתוח אוטומטי (מעל 10MB). ניתן עדיין לצרף אותו ולהזין את הפרטים ידנית."
      );
      return;
    }

    setParsing(true);
    setParseMessage("מנתח את הקובץ…");
    try {
      const formData = new FormData();
      formData.set("pdf", file);
      const result = await parseInvoicePdf(formData);

      if (!result.ok) {
        setParseMessage(result.error);
        return;
      }
      if (!result.hasTextLayer) {
        setParseMessage(
          "המסמך נראה כתמונה סרוקה ללא שכבת טקסט — לא ניתן היה לחלץ נתונים אוטומטית. יש להזין את הפרטים ידנית."
        );
        return;
      }

      if (result.lineItems.length > 0) {
        setItems(
          result.lineItems.map((item, i) => ({
            id: Date.now() + i,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        );
      }
      if (result.discount !== null) {
        setDiscount(String(result.discount));
      }
      if (result.tax !== null) {
        setTax(String(result.tax));
      }
      if (result.documentNumber) {
        setNumber(result.documentNumber);
      }

      const parts: string[] = [];
      parts.push(
        result.lineItems.length > 0
          ? `זוהו ${result.lineItems.length} שורות פריטים מהמסמך`
          : "לא זוהו שורות פריטים במסמך — ניתן להזין ידנית"
      );
      if (result.discount !== null && result.discount > 0) {
        parts.push(`זוהתה הנחה של ${result.discount.toLocaleString("he-IL")} ₪ במסמך`);
      }
      if (result.total !== null) {
        parts.push(`סה"כ שמופיע במסמך: ${result.total.toLocaleString("he-IL")} ₪ (להשוואה)`);
      }
      parts.push("בדקו ותקנו לפני שמירה.");
      setParseMessage(parts.join(" · "));
    } catch {
      setParseMessage("ניתוח הקובץ נכשל. ניתן להזין את הפרטים ידנית.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedProjectId) {
      setSubmitError("יש לבחור פרויקט לפני יצירת החשבונית");
      return;
    }
    setPending(true);
    setSubmitError(null);
    try {
      await createInvoice(selectedProjectId, formData);
      router.refresh();
      setOpen(false);
      setItems([{ ...EMPTY_ITEM }]);
      setDiscount("0");
      setTax("0");
      setNumber("");
      setParseMessage(null);
      if (needsProjectPicker) setSelectedProjectId("");
    } catch (error) {
      // createInvoice() throws on validation failures (no line items, wrong
      // file type, a PDF over the upload size limit, etc.) — this must be
      // caught here or it crashes to Next's generic error screen instead
      // of showing the person what went wrong.
      const message =
        error instanceof Error && error.message
          ? error.message
          : "יצירת החשבונית נכשלה. נסו שוב, ואם הקובץ גדול נסו קובץ קטן יותר.";
      setSubmitError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="sm">
          <Plus /> חשבונית חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>חשבונית חדשה</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {needsProjectPicker && (
            <div className="space-y-1.5">
              <Label>
                פרויקט <span className="text-status-cancelled">*</span>
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSubmitError(null);
                }}
              >
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-number">מספר חשבונית (לא חובה)</Label>
              <Input
                id="invoice-number"
                name="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="01/000411"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-due-date">תאריך פירעון (לא חובה)</Label>
              <DateInput id="invoice-due-date" name="dueDate" />
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
                <div className="w-full space-y-1.5 sm:w-auto sm:flex-1">
                  {item.id === items[0].id && <Label>תיאור</Label>}
                  <Input name="description" defaultValue={item.description} placeholder="חזיתות מטבח" />
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
              <Label htmlFor="invoice-discount">הנחה</Label>
              <Input
                id="invoice-discount"
                name="discount"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-tax">מע&quot;מ</Label>
              <Input
                id="invoice-tax"
                name="tax"
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-pdf" className="flex items-center gap-1.5">
              <FileScan className="size-3.5" />
              קובץ חשבונית (PDF, לא חובה)
            </Label>
            <input
              id="invoice-pdf"
              name="pdf"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-border/60"
            />
            <p className="text-xs text-muted-foreground">
              העלאת קובץ תנסה לזהות אוטומטית שורות, כמויות, מחירים, הנחה ומספר חשבונית מתוך המסמך.
            </p>
          </div>

          {parseMessage && (
            <p
              className={
                "rounded-md border px-3 py-2 text-xs " +
                (parsing
                  ? "border-border bg-surface-muted text-muted-foreground"
                  : "border-accent-soft bg-accent-soft/40 text-foreground")
              }
            >
              {parseMessage}
            </p>
          )}

          {submitError && (
            <p className="rounded-md border border-status-cancelled/40 bg-status-cancelled/10 px-3 py-2 text-xs text-status-cancelled">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "יוצר…" : "צור חשבונית"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
