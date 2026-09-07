"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { QuoteStatus } from "@prisma/client";

export async function createQuote(projectId: string, formData: FormData) {
  const descriptions = formData.getAll("description") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const taxRaw = String(formData.get("tax") ?? "0");

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

  if (lineItems.length === 0) throw new Error("At least one line item is required");

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = Number(taxRaw) || 0;
  const total = subtotal + tax;

  const existingCount = await prisma.quote.count({ where: { projectId } });

  const pdfFields = await readPdfField(formData);

  await prisma.quote.create({
    data: {
      projectId,
      version: existingCount + 1,
      subtotal,
      tax,
      total,
      lineItems: { create: lineItems },
      ...pdfFields,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "QUOTED" },
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

export async function attachQuotePdf(quoteId: string, formData: FormData) {
  const pdfFields = await readPdfField(formData);
  if (!pdfFields.pdfData) {
    throw new Error("לא נבחר קובץ PDF");
  }

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: pdfFields,
    select: { projectId: true },
  });

  revalidatePath(`/projects/${quote.projectId}`);
  revalidatePath("/quotes");
}

export async function removeQuotePdf(quoteId: string) {
  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { pdfData: null, pdfFileName: null, pdfMimeType: null, pdfSize: null },
    select: { projectId: true },
  });

  revalidatePath(`/projects/${quote.projectId}`);
  revalidatePath("/quotes");
}

export async function updateQuoteStatus(
  projectId: string,
  quoteId: string,
  status: QuoteStatus
) {
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });

  if (status === "APPROVED") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "APPROVED" },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/quotes");
}
