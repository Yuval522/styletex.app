"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ClientNameMatch = {
  id: string;
  name: string;
  projects: { id: string; name: string }[];
};

/**
 * Looks up existing clients with a matching (case-insensitive) name, so the
 * "New Client" dialog can warn before creating a duplicate client record for
 * a location/customer that already exists in the system.
 *
 * Context: the data model has always allowed many projects per client
 * (Client.projects is one-to-many, no unique constraint on name or on
 * clientId) — createProject() already lets you attach any number of
 * distinct projects to an existing client from the client detail page, the
 * global /projects page, or the quote/invoice project pickers. Nothing was
 * ever merging or overwriting projects at the data layer. The real gap was
 * discoverability: nothing nudged people away from re-running "New Client"
 * for a second project at the same site/location, which silently creates a
 * second, disconnected Client row with the same name instead of adding a
 * second Project to the existing one. This lookup powers a non-blocking
 * warning for that case — it never prevents creating a genuine second
 * client that happens to share a name.
 */
export async function findClientsByName(name: string): Promise<ClientNameMatch[]> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return [];

  const matches = await prisma.client.findMany({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      projects: { select: { id: true, name: true }, orderBy: { createdAt: "desc" } },
    },
    take: 5,
  });

  return matches;
}

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
