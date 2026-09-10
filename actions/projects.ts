"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProjectStatus } from "@prisma/client";

export async function createProject(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const targetDateRaw = String(formData.get("targetDate") ?? "").trim();

  if (!clientId || !name) throw new Error("Client and project name are required");

  const project = await prisma.project.create({
    data: {
      clientId,
      name,
      budget: budgetRaw ? Number(budgetRaw) : null,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const targetDateRaw = String(formData.get("targetDate") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) throw new Error("Project name is required");

  const project = await prisma.project.update({
    where: { id },
    data: {
      name,
      budget: budgetRaw ? Number(budgetRaw) : null,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
      startDate: startDateRaw ? new Date(startDateRaw) : null,
      notes,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/clients/${project.clientId}`);
  return project;
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const project = await prisma.project.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/production");
  return project;
}

/**
 * Manually forces one step of the vertical lifecycle timeline (global
 * /projects view) to done or pending, overriding whatever the automatic
 * client/quote/payment/status-derived logic would otherwise show for that
 * step — see components/projects/project-stepper.tsx. Clicking the same
 * checkpoint again flips it back, and toggling it to match what the
 * automatic logic already says effectively clears the override (it just
 * won't visibly change anything).
 */
export async function toggleProjectCheckpoint(
  projectId: string,
  stageKey: string,
  done: boolean
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { checkpointOverrides: true },
  });
  if (!project) throw new Error("הפרויקט לא נמצא");

  const overrides =
    project.checkpointOverrides && typeof project.checkpointOverrides === "object"
      ? { ...(project.checkpointOverrides as Record<string, boolean>) }
      : {};
  overrides[stageKey] = done;

  await prisma.project.update({
    where: { id: projectId },
    data: { checkpointOverrides: overrides },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(id: string) {
  const project = await prisma.project.delete({ where: { id } });

  revalidatePath("/projects");
  revalidatePath(`/clients/${project.clientId}`);
  revalidatePath("/quotes");
  revalidatePath("/calendar");
  revalidatePath("/production");
  revalidatePath("/");
}
