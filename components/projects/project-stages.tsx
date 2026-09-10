import { formatDate } from "@/lib/utils";
import { PaymentToggle } from "@/components/quotes/payment-toggle";
import type { ProjectStatus, QuoteStatus } from "@prisma/client";

// Deliberately NOT "use client": getProjectStages() is plain data-crunching
// logic called directly from the Server Component at
// app/(dashboard)/projects/page.tsx. React Server Components treat every
// export of a "use client" module as a client reference — calling one as a
// plain function from server code throws at runtime ("Attempted to call
// getProjectStages() from the server but getProjectStages is on the
// client"). Keeping this function in its own plain module, separate from
// the interactive <ProjectStepper> in project-stepper.tsx, is what lets the
// server component call it directly while ProjectStepper stays a client
// component for its click-to-toggle behavior.

export type StageState = "done" | "current" | "warning" | "upcoming";

export type Stage = {
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
