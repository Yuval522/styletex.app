"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductionStage } from "@prisma/client";

export async function createWorkOrder(projectId: string, formData: FormData) {
  const assignedTo = String(formData.get("assignedTo") ?? "").trim() || null;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.workOrder.create({
    data: {
      projectId,
      assignedTo,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      notes,
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

export async function updateWorkOrderStage(id: string, stage: ProductionStage) {
  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { stage },
  });

  revalidatePath("/production");
  revalidatePath(`/projects/${workOrder.projectId}`);
  return workOrder;
}
