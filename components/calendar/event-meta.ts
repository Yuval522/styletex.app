import type { CalendarEventType } from "@prisma/client";

export const EVENT_TYPES: CalendarEventType[] = [
  "MEASUREMENT",
  "CLIENT_MEETING",
  "MANUFACTURING_START",
  "DELIVERY",
  "INSTALLATION",
  "OTHER",
];

export const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  MEASUREMENT: "מדידת שטח",
  CLIENT_MEETING: "פגישת לקוח",
  MANUFACTURING_START: "תחילת ייצור",
  DELIVERY: "אספקה",
  INSTALLATION: "התקנה",
  OTHER: "אחר",
};

// Reuses the same muted palette tokens as the project status system
export const EVENT_TYPE_COLOR: Record<CalendarEventType, string> = {
  MEASUREMENT: "bg-status-design/15 text-status-design border-status-design/30",
  CLIENT_MEETING: "bg-status-lead/15 text-status-lead border-status-lead/30",
  MANUFACTURING_START:
    "bg-status-production/15 text-status-production border-status-production/30",
  DELIVERY:
    "bg-status-installation/15 text-status-installation border-status-installation/30",
  INSTALLATION: "bg-status-approved/15 text-status-approved border-status-approved/30",
  OTHER: "bg-surface-muted text-foreground border-border",
};

export type CalendarEventWithProject = {
  id: string;
  title: string;
  type: CalendarEventType;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  notes: string | null;
  projectId: string | null;
  project: { id: string; name: string; client: { name: string } } | null;
};
