import { cn, formatCurrency } from "@/lib/utils";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_SWATCH,
  STAGE_LABEL,
  STAGE_SWATCH,
} from "@/components/shared/status-badge";

const EmptyChartState = ({ message }: { message: string }) => (
  <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
);

/** Stacked horizontal bar showing how active projects split across statuses. */
export function PipelineDistribution({ counts }: { counts: Record<string, number> }) {
  const order = [
    "LEAD",
    "DESIGN",
    "QUOTED",
    "APPROVED",
    "PRODUCTION",
    "INSTALLATION",
    "COMPLETE",
  ];
  const entries = order
    .map((status) => ({ status, count: counts[status] ?? 0 }))
    .filter((e) => e.count > 0);
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return <EmptyChartState message="אין עדיין פרויקטים פעילים להצגה." />;
  }

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
        {entries.map((e) => (
          <div
            key={e.status}
            className={cn(PROJECT_STATUS_SWATCH[e.status], "h-full")}
            style={{ width: `${(e.count / total) * 100}%` }}
            title={`${PROJECT_STATUS_LABEL[e.status]}: ${e.count}`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {entries.map((e) => (
          <div key={e.status} className="flex items-center gap-2 text-xs">
            <span className={cn("size-2.5 shrink-0 rounded-full", PROJECT_STATUS_SWATCH[e.status])} />
            <span className="text-muted-foreground">{PROJECT_STATUS_LABEL[e.status]}</span>
            <span className="font-medium text-foreground">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars showing open work orders grouped by production stage. */
export function ProductionBreakdown({ counts }: { counts: Record<string, number> }) {
  const order = ["CUTTING", "ASSEMBLY", "FINISHING", "QC", "READY"];
  const entries = order.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
  const max = Math.max(1, ...entries.map((e) => e.count));
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return <EmptyChartState message="אין כרגע הזמנות עבודה פתוחות." />;
  }

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.stage} className="flex items-center gap-3 text-xs">
          <span className="w-16 shrink-0 text-muted-foreground">{STAGE_LABEL[e.stage]}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn("h-full rounded-full", STAGE_SWATCH[e.stage])}
              style={{ width: `${(e.count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 shrink-0 text-end font-medium text-foreground">{e.count}</span>
        </div>
      ))}
    </div>
  );
}

/** Vertical bar chart of active pipeline value grouped by target month. */
export function MonthlyValueChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <EmptyChartState message="אין עדיין יעדי תאריך עם תקציב לפרויקטים פעילים." />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex h-36 items-end justify-between gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-full max-w-8 rounded-t-md bg-accent transition-all"
                style={{ height: d.value > 0 ? `${Math.max((d.value / max) * 100, 4)}%` : "2px" }}
                title={formatCurrency(d.value)}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** CSS conic-gradient donut: share of approved quote value already paid. */
export function PaymentDonut({ paid, total }: { paid: number; total: number }) {
  if (total === 0) {
    return <EmptyChartState message="אין עדיין הצעות מחיר מאושרות." />;
  }
  const pct = Math.round((paid / total) * 100);

  return (
    <div className="flex items-center justify-center gap-6">
      <div
        className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--accent) 0 ${pct}%, var(--border) ${pct}% 100%)`,
        }}
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-surface">
          <p className="font-display text-lg text-foreground">{pct}%</p>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-accent" />
          <span className="text-muted-foreground">שולם</span>
          <span className="font-medium text-foreground">{formatCurrency(paid)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="text-muted-foreground">טרם שולם</span>
          <span className="font-medium text-foreground">{formatCurrency(total - paid)}</span>
        </div>
      </div>
    </div>
  );
}
