"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleProjectCheckpoint } from "@/actions/projects";
import type { Stage } from "@/components/projects/project-stages";

export function ProjectStepper({
  projectId,
  stages,
}: {
  projectId: string;
  stages: Stage[];
}) {
  return (
    <ol>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <li key={stage.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StageDot projectId={projectId} stage={stage} />
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1",
                    stage.state === "done" ? "bg-accent/40" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className={cn("w-full pb-5", isLast && "pb-0.5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    stage.state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {stage.title}
                  {stage.manual && (
                    <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                      (סומן ידנית)
                    </span>
                  )}
                </p>
                {stage.action}
              </div>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  stage.state === "warning" ? "text-status-cancelled" : "text-muted-foreground"
                )}
              >
                {stage.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The checkmark dot doubles as the toggle control: clicking it marks that
 * checkpoint done (or, if it's already done, reverts it back to pending) —
 * see actions/projects.ts::toggleProjectCheckpoint. The very first "client
 * details" step is never actionable, since a project always has a client.
 */
function StageDot({ projectId, stage }: { projectId: string; stage: Stage }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isDone = stage.state === "done";
  const toggleable = stage.key !== "client";

  function handleClick() {
    if (!toggleable || isPending) return;
    startTransition(async () => {
      await toggleProjectCheckpoint(projectId, stage.key, !isDone);
      router.refresh();
    });
  }

  const label = isDone
    ? `סמן "${stage.title}" כלא הושלם`
    : `סמן "${stage.title}" כהושלם`;

  const dot =
    stage.state === "done" ? (
      <CheckCircle2 className="size-5 shrink-0 text-accent" />
    ) : stage.state === "warning" ? (
      <XCircle className="size-5 shrink-0 text-status-cancelled" />
    ) : stage.state === "current" ? (
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <span className="size-2.5 rounded-full bg-accent ring-4 ring-accent-soft" />
      </span>
    ) : (
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <span className="size-2.5 rounded-full border-2 border-border bg-surface" />
      </span>
    );

  if (!toggleable) return dot;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 shrink-0 -m-1.5 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:opacity-60",
      )}
    >
      {dot}
    </button>
  );
}
