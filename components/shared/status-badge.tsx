import { cn } from "@/lib/utils";

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  LEAD: "ליד",
  DESIGN: "תכנון",
  QUOTED: "הצעת מחיר",
  APPROVED: "אושר",
  PRODUCTION: "בייצור",
  INSTALLATION: "התקנה",
  COMPLETE: "הושלם",
  CANCELLED: "בוטל",
};

export const PROJECT_STATUS_COLOR: Record<string, string> = {
  LEAD: "bg-status-lead/15 text-status-lead",
  DESIGN: "bg-status-design/15 text-status-design",
  QUOTED: "bg-status-quoted/15 text-status-quoted",
  APPROVED: "bg-status-approved/15 text-status-approved",
  PRODUCTION: "bg-status-production/15 text-status-production",
  INSTALLATION: "bg-status-installation/15 text-status-installation",
  COMPLETE: "bg-status-complete/15 text-status-complete",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

// Solid swatch tokens (for chart bars/legends, as opposed to the
// translucent badge backgrounds above).
export const PROJECT_STATUS_SWATCH: Record<string, string> = {
  LEAD: "bg-status-lead",
  DESIGN: "bg-status-design",
  QUOTED: "bg-status-quoted",
  APPROVED: "bg-status-approved",
  PRODUCTION: "bg-status-production",
  INSTALLATION: "bg-status-installation",
  COMPLETE: "bg-status-complete",
  CANCELLED: "bg-status-cancelled",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        PROJECT_STATUS_COLOR[status] ?? "bg-surface-muted text-foreground"
      )}
    >
      {PROJECT_STATUS_LABEL[status] ?? status}
    </span>
  );
}

const QUOTE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "טיוטה",
  SENT: "נשלח",
  APPROVED: "אושר",
  REJECTED: "נדחה",
};

const QUOTE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-status-lead/15 text-status-lead",
  SENT: "bg-status-design/15 text-status-design",
  APPROVED: "bg-status-approved/15 text-status-approved",
  REJECTED: "bg-status-cancelled/15 text-status-cancelled",
};

export function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        QUOTE_STATUS_COLOR[status] ?? "bg-surface-muted text-foreground"
      )}
    >
      {QUOTE_STATUS_LABEL[status] ?? status}
    </span>
  );
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  ISSUED: "הופקה",
  PAID: "שולמה",
  OVERDUE: "באיחור",
  CANCELLED: "בוטלה",
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
  ISSUED: "bg-status-design/15 text-status-design",
  PAID: "bg-status-approved/15 text-status-approved",
  OVERDUE: "bg-status-cancelled/15 text-status-cancelled",
  CANCELLED: "bg-surface-muted text-muted-foreground",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        INVOICE_STATUS_COLOR[status] ?? "bg-surface-muted text-foreground"
      )}
    >
      {INVOICE_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const STAGE_LABEL: Record<string, string> = {
  CUTTING: "חיתוך",
  ASSEMBLY: "הרכבה",
  FINISHING: "גימור",
  QC: "בקרת איכות",
  READY: "מוכן",
};

export const STAGE_SWATCH: Record<string, string> = {
  CUTTING: "bg-status-lead",
  ASSEMBLY: "bg-status-design",
  FINISHING: "bg-status-quoted",
  QC: "bg-status-installation",
  READY: "bg-status-complete",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-foreground whitespace-nowrap">
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
