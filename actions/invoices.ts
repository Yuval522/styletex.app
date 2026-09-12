"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { InvoiceStatus } from "@prisma/client";
import { parseFinancialDocument, type ParsedLineItem } from "@/lib/parse-document";

export type InvoiceDocumentParseResult =
  | {
      ok: true;
      hasTextLayer: true;
      lineItems: ParsedLineItem[];
      subtotal: number | null;
      discount: number | null;
      tax: number | null;
      total: number | null;
      documentNumber: string | null;
      textPreview: string;
    }
  | { ok: true; hasTextLayer: false }
  | { ok: false; error: string };

// Independent of the global Server Action body-size limit (next.config.ts) —
// this caps how large a file we're willing to hand to the PDF parser
// itself, so a huge upload fails fast with a clear message instead of
// tying up the function for a long time on a document no one intends to
// parse anyway.
const MAX_PARSE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Reads an uploaded invoice PDF and returns a best-effort extraction of its
 * line items, subtotal, tax, total and invoice number — meant to pre-fill
 * the "New Invoice" form, never to be saved unreviewed. Read-only: this
 * never touches the database. See lib/parse-document.ts for the extraction
 * approach and its known limitations (no OCR).
 */
export async function parseInvoicePdf(formData: FormData): Promise<InvoiceDocumentParseResult> {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "לא נבחר קובץ" };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, error: "ניתן לנתח קובץ PDF בלבד" };
  }
  if (file.size > MAX_PARSE_SIZE) {
    return { ok: false, error: "הקובץ גדול מדי לניתוח אוטומטי (מעל 10MB). ניתן עדיין לצרף אותו ולהזין את הפרטים ידנית." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // A browser can lie about a file's MIME type (or the file can simply be
    // corrupt) — checking the actual PDF magic bytes before handing this to
    // the parser avoids feeding it arbitrary binary data.
    const isPdf = buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    if (!isPdf) {
      return { ok: false, error: "הקובץ אינו PDF תקין" };
    }
    const result = await parseFinancialDocument(buffer);
    if (!result.hasTextLayer) {
      return { ok: true, hasTextLayer: false };
    }
    return {
      ok: true,
      hasTextLayer: true,
      lineItems: result.lineItems,
      subtotal: result.subtotal,
      discount: result.discount,
      tax: result.tax,
      total: result.total,
      documentNumber: result.documentNumber,
      textPreview: result.textPreview,
    };
  } catch (error) {
    console.error("[parseInvoicePdf] failed to parse PDF —", error);
    return { ok: false, error: "ניתוח הקובץ נכשל. ניתן להזין את הפרטים ידנית." };
  }
}

export async function createInvoice(projectId: string, formData: FormData) {
  const descriptions = formData.getAll("description") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const discountRaw = String(formData.get("discount") ?? "0");
  const taxRaw = String(formData.get("tax") ?? "0");
  const number = String(formData.get("number") ?? "").trim() || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  const lineItems = descriptions
    .map((description, i) => {
      const quantity = Number(quantities[i] ?? 0);
      const unitPrice = Number(unitPrices[i] ?? 0);
      return {
        description: description?.trim(),
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    })
    .filter((item) => item.description);

  if (lineItems.length === 0) throw new Error("יש להזין לפחות שורת פריט אחת עם תיאור");

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const discount = Number(discountRaw) || 0;
  const tax = Number(taxRaw) || 0;
  // Discount is applied before tax, matching how the source documents
  // compute their own "total to pay" — see lib/parse-document.ts quirk 3.
  const total = subtotal - discount + tax;

  const pdfFields = await readPdfField(formData);

  await prisma.invoice.create({
    data: {
      projectId,
      number,
      subtotal,
      discount,
      tax,
      total,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      lineItems: { create: lineItems },
      ...pdfFields,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/quotes");
}

async function readPdfField(formData: FormData) {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.type !== "application/pdf") {
    throw new Error("ניתן לצרף קובץ PDF בלבד");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    pdfData: buffer,
    pdfFileName: file.name,
    pdfMimeType: file.type,
    pdfSize: file.size,
  };
}

export async function attachInvoicePdf(invoiceId: string, formData: FormData) {
  const pdfFields = await readPdfField(formData);
  if (!pdfFields.pdfData) {
    throw new Error("לא נבחר קובץ PDF");
  }

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: pdfFields,
    select: { projectId: true },
  });

  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/quotes");
}

export async function removeInvoicePdf(invoiceId: string) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfData: null, pdfFileName: null, pdfMimeType: null, pdfSize: null },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/quotes");
}

export async function updateInvoiceStatus(
  projectId: string,
  invoiceId: string,
  status: InvoiceStatus
) {
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      // Keep paidAt in sync with the status itself, whichever direction
      // it's being switched — see updateInvoicePaid() for the same rule
      // driven from the payment toggle instead of the status dropdown.
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/quotes");
}

export async function updateInvoicePaid(invoiceId: string, paid: boolean) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: paid ? "PAID" : "ISSUED",
      paidAt: paid ? new Date() : null,
    },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/quotes");
}

export async function deleteInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.delete({
    where: { id: invoiceId },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/quotes");
}
