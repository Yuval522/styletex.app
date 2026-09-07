"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductionStage } from "@prisma/client";

export async function createWorkOrder(projectId: string, formData: FormData) {
  const assignedTo = String(formData.get("assignedTo") ?? "").trim() || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const stageRaw = String(formData.get("stage") ?? "").trim();
  const stage = stageRaw ? (stageRaw as ProductionStage) : undefined;

  await prisma.workOrder.create({
    data: {
      projectId,
      assignedTo,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      notes,
      ...(stage ? { stage } : {}),
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "PRODUCTION" },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/production");
  revalidatePath("/projects");
}

export async function deleteWorkOrder(id: string) {
  const workOrder = await prisma.workOrder.delete({ where: { id } });

  revalidatePath("/production");
  revalidatePath(`/projects/${workOrder.projectId}`);
  revalidatePath("/projects");
}

export async function updateWorkOrderStage(id: string, stage: ProductionStage) {
  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { stage },
  });

  revalidatePath("/production");
  revalidatePath(`/projects/${workOrder.projectId}`);
  return workOrder;
}
