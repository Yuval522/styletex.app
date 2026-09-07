"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) throw new Error("Client name is required");

  const client = await prisma.client.create({
    data: { name, email, phone, address, notes },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.client.update({
    where: { id },
    data: { name, email, phone, address, notes },
  });

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });

  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/quotes");
  revalidatePath("/calendar");
  revalidatePath("/");
}
