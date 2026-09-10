"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRoom(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם החדר הוא שדה חובה");

  await prisma.room.create({
    data: { projectId, name },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteRoom(id: string) {
  // CabinetSpec.room has onDelete: Cascade, so this also removes every
  // spec that belonged to the room.
  const room = await prisma.room.delete({ where: { id } });

  revalidatePath(`/projects/${room.projectId}`);
}

export async function createCabinetSpec(
  projectId: string,
  roomId: string,
  formData: FormData
) {
  const doorStyle = String(formData.get("doorStyle") ?? "").trim();
  const finish = String(formData.get("finish") ?? "").trim();
  const width = Number(formData.get("width") ?? 0);
  const height = Number(formData.get("height") ?? 0);
  const depth = Number(formData.get("depth") ?? 0);
  const hardware = String(formData.get("hardware") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const materialId = String(formData.get("materialId") ?? "") || null;

  await prisma.cabinetSpec.create({
    data: {
      roomId,
      doorStyle,
      finish,
      width,
      height,
      depth,
      hardware,
      notes,
      materialId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteCabinetSpec(projectId: string, id: string) {
  await prisma.cabinetSpec.delete({ where: { id } });

  revalidatePath(`/projects/${projectId}`);
}
