"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MaterialType } from "@prisma/client";

export async function createMaterial(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "OTHER") as MaterialType;
  const unitCost = Number(formData.get("unitCost") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  const stockQty = String(formData.get("stockQty") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "") || null;

  if (!name || !unit) throw new Error("Name and unit are required");

  await prisma.material.create({
    data: {
      name,
      type,
      unitCost,
      unit,
      stockQty: stockQty ? Number(stockQty) : null,
      supplierId,
    },
  });

  revalidatePath("/materials");
}

export async function updateMaterial(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "OTHER") as MaterialType;
  const unitCost = Number(formData.get("unitCost") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  const stockQty = String(formData.get("stockQty") ?? "").trim();
  const reorderLevel = String(formData.get("reorderLevel") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "") || null;

  if (!name || !unit) throw new Error("Name and unit are required");

  await prisma.material.update({
    where: { id },
    data: {
      name,
      type,
      unitCost,
      unit,
      stockQty: stockQty ? Number(stockQty) : null,
      reorderLevel: reorderLevel ? Number(reorderLevel) : null,
      supplierId,
    },
  });

  revalidatePath("/materials");
}

export async function deleteMaterial(id: string) {
  try {
    await prisma.material.delete({ where: { id } });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2003" || code === "P2014") {
      throw new Error("לא ניתן למחוק חומר המשויך למפרטי מוצר קיימים.");
    }
    throw e;
  }

  revalidatePath("/materials");
}

export async function createSupplier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) throw new Error("Supplier name is required");

  await prisma.supplier.create({
    data: { name, contact, email, phone },
  });

  revalidatePath("/materials");
}
