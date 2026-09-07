import { CheckCircle2, XCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PaymentToggle } from "@/components/quotes/payment-toggle";
import type { ProjectStatus, QuoteStatus } from "@prisma/client";

type StageState = "done" | "current" | "warning" | "upcoming";

type Stage = {
  key: string;
  title: string;
  detail: string;
  state: StageState;
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
 * Builds the 5-step lifecycle tracker for a single project, entirely
 * from real, persisted data: the client record, the most recent quote
 * (status, PDF, paid flag), and the project's own status/start date.
 */
export function getProjectStages({
  client,
  latestQuote,
  projectStatus,
  startDate,
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
}): Stage[] {
  const stages: Stage[] = [];

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

  return stages;
}

export function ProjectStepper({ stages }: { stages: Stage[] }) {
  return (
    <ol>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <li key={stage.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StageDot state={stage.state} />
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

function StageDot({ state }: { state: StageState }) {
  if (state === "done") {
    return <CheckCircle2 className="size-5 shrink-0 text-accent" />;
  }
  if (state === "warning") {
    return <XCircle className="size-5 shrink-0 text-status-cancelled" />;
  }
  if (state === "current") {
    return (
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <span className="size-2.5 rounded-full bg-accent ring-4 ring-accent-soft" />
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
      <span className="size-2.5 rounded-full border-2 border-border bg-surface" />
    </span>
  );
}
