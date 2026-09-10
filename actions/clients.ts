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

  if (!name) throw new Error("שם הלקוח הוא שדה חובה");

  // Every new client is created together with its first linked project in
  // a single write, so clients and projects stay integrated instead of
  // being two separate, disjointed steps in the workflow.
  const client = await prisma.client.create({
    data: {
      name,
      email,
      phone,
      address,
      notes,
      projects: {
        create: {
          name: `מטבח ${name}`,
        },
      },
    },
    include: { projects: true },
  });

  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/");

  const [project] = client.projects;
  redirect(`/projects/${project.id}`);
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
