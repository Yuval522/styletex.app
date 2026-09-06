import { cn } from "@/lib/utils";

const PROJECT_STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  DESIGN: "Design",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  PRODUCTION: "Production",
  INSTALLATION: "Installation",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
};

const PROJECT_STATUS_COLOR: Record<string, string> = {
  LEAD: "bg-status-lead/15 text-status-lead",
  DESIGN: "bg-status-design/15 text-status-design",
  QUOTED: "bg-status-quoted/15 text-status-quoted",
  APPROVED: "bg-status-approved/15 text-status-approved",
  PRODUCTION: "bg-status-production/15 text-status-production",
  INSTALLATION: "bg-status-installation/15 text-status-installation",
  COMPLETE: "bg-status-complete/15 text-status-complete",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        QUOTE_STATUS_COLOR[status] ?? "bg-surface-muted text-foreground"
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

const STAGE_LABEL: Record<string, string> = {
  CUTTING: "Cutting",
  ASSEMBLY: "Assembly",
  FINISHING: "Finishing",
  QC: "Quality Check",
  READY: "Ready",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-foreground whitespace-nowrap">
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
