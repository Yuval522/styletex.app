"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectStepper } from "@/components/projects/project-stepper";
import type { Stage } from "@/components/projects/project-stages";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

export type TimelineProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  budget: number | null;
  targetDate: Date | null;
  stages: Stage[];
};

/**
 * Clicking a client heading on the grouped /projects view (rendered only
 * when that client has more than one concurrent project) opens a
 * side-by-side comparison of every one of that client's projects' lifecycle
 * timelines, so overlapping jobs at the same client/site can be tracked
 * against each other instead of only one at a time.
 */
export function ClientParallelTimeline({
  clientName,
  projects,
}: {
  clientName: string;
  projects: TimelineProject[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 flex items-center gap-2 rounded-md text-start transition-colors hover:text-accent"
      >
        <h2 className="font-display text-base text-foreground">{clientName}</h2>
        <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
          <Layers className="size-3" />
          {projects.length} פרויקטים באותו לקוח · ציר זמן מקביל
        </span>
      </button>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>ציר זמן מקביל — {clientName}</DialogTitle>
          <DialogDescription>
            השוואת ההתקדמות של כל הפרויקטים הפעילים אצל הלקוח הזה, זה לצד זה.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className="w-72 shrink-0 rounded-lg border border-border p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-border pb-3">
                <div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {project.budget ? formatCurrency(project.budget) : "לא נקבע תקציב"}
                    {" · "}
                    יעד {formatDate(project.targetDate)}
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <ProjectStepper projectId={project.id} stages={project.stages} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
