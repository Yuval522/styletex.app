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

  if (!name) throw new Error("Project name is required");

  const project = await prisma.project.update({
    where: { id },
    data: {
      name,
      budget: budgetRaw ? Number(budgetRaw) : null,
      targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
      startDate: startDateRaw ? new Date(startDateRaw) : null,
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
