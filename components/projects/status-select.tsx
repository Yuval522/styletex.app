"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProjectStatus } from "@/actions/projects";
import type { ProjectStatus } from "@prisma/client";

const STATUSES: ProjectStatus[] = [
  "LEAD",
  "DESIGN",
  "QUOTED",
  "APPROVED",
  "PRODUCTION",
  "INSTALLATION",
  "COMPLETE",
  "CANCELLED",
];

const LABEL: Record<ProjectStatus, string> = {
  LEAD: "ליד",
  DESIGN: "תכנון",
  QUOTED: "הצעת מחיר",
  APPROVED: "אושר",
  PRODUCTION: "בייצור",
  INSTALLATION: "התקנה",
  COMPLETE: "הושלם",
  CANCELLED: "בוטל",
};

export function ProjectStatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(value) =>
        startTransition(() => {
          updateProjectStatus(projectId, value as ProjectStatus);
        })
      }
    >
      <SelectTrigger className="h-9 w-[150px] text-xs" disabled={isPending}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
