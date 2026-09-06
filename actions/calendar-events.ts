"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CalendarEventType } from "@prisma/client";

function parseFormFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "OTHER") as CalendarEventType;
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const startAtRaw = String(formData.get("startAt") ?? "").trim();
  const endAtRaw = String(formData.get("endAt") ?? "").trim();
  const allDay = formData.get("allDay") === "on" || formData.get("allDay") === "true";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) throw new Error("כותרת האירוע היא שדה חובה");
  if (!startAtRaw) throw new Error("תאריך התחלה הוא שדה חובה");

  return {
    title,
    type,
    projectId,
    startAt: new Date(startAtRaw),
    endAt: endAtRaw ? new Date(endAtRaw) : null,
    allDay,
    notes,
  };
}

export async function createCalendarEvent(formData: FormData) {
  const data = parseFormFields(formData);

  await prisma.calendarEvent.create({ data });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (data.projectId) revalidatePath(`/projects/${data.projectId}`);
}

export async function updateCalendarEvent(id: string, formData: FormData) {
  const data = parseFormFields(formData);

  const event = await prisma.calendarEvent.update({
    where: { id },
    data,
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.projectId) revalidatePath(`/projects/${event.projectId}`);
}

export async function moveCalendarEvent(id: string, newStartAtISO: string) {
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) throw new Error("האירוע לא נמצא");

  const newStart = new Date(newStartAtISO);
  let newEnd: Date | null = null;

  if (existing.endAt) {
    const durationMs = existing.endAt.getTime() - existing.startAt.getTime();
    newEnd = new Date(newStart.getTime() + durationMs);
  }

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: { startAt: newStart, endAt: newEnd },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.projectId) revalidatePath(`/projects/${event.projectId}`);

  return event;
}

export async function deleteCalendarEvent(id: string) {
  const event = await prisma.calendarEvent.delete({ where: { id } });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (event.projectId) revalidatePath(`/projects/${event.projectId}`);
}
