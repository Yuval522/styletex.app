"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PaymentToggle } from "@/components/quotes/payment-toggle";
import { toggleProjectCheckpoint } from "@/actions/projects";
import type { ProjectStatus, QuoteStatus } from "@prisma/client";

type StageState = "done" | "current" | "warning" | "upcoming";

type Stage = {
  key: string;
  title: string;
  detail: string;
  state: StageState;
  /** True when a person overrode this step by hand rather than it being
   * derived automatically from real data. */
  manual: boolean;
  action?: React.ReactNode;
};

const PROJECT_EXECUTION_LABEL: Record<ProjectStatus, string> = {
  LEAD: "טרם החל",
  DESIGN: "בשלב תכנון",
  QUOTED: "ממתין לאישור הצעת מחיר",
  APPROVED: "מוכן לתחילת ייצור",
  PRODUCTION: "בביצוע — בייצור",
  INSTALLATION: "בביצוע — בהתקנה",
  COMPLETE: "הפרויקט הושלם",
  CANCELLED: "הפרויקט בוטל",
};

/**
 * Builds the 5-step lifecycle tracker for a single project, from real,
 * persisted data (the client record, the most recent quote, the project's
 * own status/start date) — with an optional manual override per step, keyed
 * by stage `key`, layered on top. An override forces that one step to
 * "done" or "upcoming" regardless of what the automatic logic would say;
 * every step without an override keeps behaving exactly as before. See
 * actions/projects.ts::toggleProjectCheckpoint.
 */
export function getProjectStages({
  client,
  latestQuote,
  projectStatus,
  startDate,
  overrides = {},
}: {
  client: { name: string; email: string | null; phone: string | null };
  latestQuote: {
    id: string;
    status: QuoteStatus;
    paid: boolean;
    paidAt: Date | null;
    total: number;
  } | null;
  projectStatus: ProjectStatus;
  startDate: Date | null;
  overrides?: Record<string, boolean>;
}): Stage[] {
  const stages: Omit<Stage, "manual">[] = [];

  // 1. Client details
  stages.push({
    key: "client",
    title: "פרטי לקוח",
    detail: [client.name, client.phone, client.email].filter(Boolean).join(" · "),
    state: "done",
  });

  // 2. Quote sent
  const wasSent = !!latestQuote && latestQuote.status !== "DRAFT";
  stages.push({
    key: "quote-sent",
    title: "נשלחה הצעת מחיר",
    detail: latestQuote
      ? wasSent
        ? "הצעת המחיר נשלחה ללקוח"
        : "קיימת טיוטת הצעת מחיר שטרם נשלחה"
      : "טרם הוכנה הצעת מחיר",
    state: wasSent ? "done" : latestQuote ? "current" : "upcoming",
  });

  // 3. Quote response / approval status
  let responseDetail = "ממתין להכנת הצעת מחיר";
  let responseState: StageState = "upcoming";
  if (latestQuote?.status === "APPROVED") {
    responseDetail = "הלקוח אישר את הצעת המחיר";
    responseState = "done";
  } else if (latestQuote?.status === "REJECTED") {
    responseDetail = "הלקוח דחה את הצעת המחיר";
    responseState = "warning";
  } else if (latestQuote?.status === "SENT") {
    responseDetail = "ממתין לתשובת הלקוח";
    responseState = "current";
  } else if (latestQuote?.status === "DRAFT") {
    responseDetail = "טרם נשלחה הצעת המחיר";
    responseState = "upcoming";
  }
  stages.push({
    key: "quote-response",
    title: "הוחזרה הצעת מחיר / אישור",
    detail: responseDetail,
    state: responseState,
  });

  // 4. Payment status
  const approved = latestQuote?.status === "APPROVED";
  let paymentState: StageState = "upcoming";
  let paymentDetail = "ממתין לאישור הצעת המחיר";
  if (approved) {
    if (latestQuote!.paid) {
      paymentDetail = `שולם${latestQuote!.paidAt ? ` · ${formatDate(latestQuote!.paidAt)}` : ""}`;
      paymentState = "done";
    } else {
      paymentDetail = "הצעת המחיר אושרה — טרם שולם";
      paymentState = "current";
    }
  }
  stages.push({
    key: "payment",
    title: "סטטוס תשלום",
    detail: paymentDetail,
    state: paymentState,
    action:
      approved && latestQuote ? (
        <PaymentToggle quoteId={latestQuote.id} paid={latestQuote.paid} />
      ) : undefined,
  });

  // 5. Project start / execution
  const executing = ["PRODUCTION", "INSTALLATION"].includes(projectStatus);
  const complete = projectStatus === "COMPLETE";
  const cancelled = projectStatus === "CANCELLED";
  stages.push({
    key: "execution",
    title: "תחילת פרויקט / ביצוע",
    detail:
      PROJECT_EXECUTION_LABEL[projectStatus] +
      (startDate ? ` · החל ב-${formatDate(startDate)}` : ""),
    state: cancelled ? "warning" : complete || executing ? "done" : projectStatus === "APPROVED" ? "current" : "upcoming",
  });

  return stages.map((stage) => {
    const override = overrides[stage.key];
    if (override === undefined) return { ...stage, manual: false };
    return {
      ...stage,
      state: override ? "done" : "upcoming",
      manual: true,
    };
  });
}

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
