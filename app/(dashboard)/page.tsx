import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import {
  PipelineDistribution,
  ProductionBreakdown,
  MonthlyValueChart,
  PaymentDonut,
} from "@/components/dashboard/charts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProjectStatus, ProductionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

function buildMonthlyBuckets(
  projects: { targetDate: Date | null; budget: unknown }[],
  monthsAhead = 6
) {
  const now = new Date();
  const buckets = Array.from({ length: monthsAhead }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: new Intl.DateTimeFormat("he-IL", { month: "short" }).format(d),
      value: 0,
    };
  });

  for (const p of projects) {
    if (!p.targetDate || !p.budget) continue;
    const key = `${p.targetDate.getFullYear()}-${p.targetDate.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.value += Number(p.budget);
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}

export default async function OverviewPage() {
  const [projects, clients, approvedQuotes, openWorkOrders] = await Promise.all([
    prisma.project.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count(),
    prisma.quote.findMany({
      where: { status: "APPROVED" },
      select: { total: true, paid: true },
    }),
    prisma.workOrder.findMany({
      where: { stage: { not: "READY" } },
      select: { stage: true },
    }),
  ]);

  const activeProjects = projects.filter(
    (p) => !["COMPLETE", "CANCELLED"].includes(p.status)
  );
  const pipelineValue = activeProjects.reduce(
    (sum, p) => sum + Number(p.budget ?? 0),
    0
  );
  const approvedValue = approvedQuotes.reduce((sum, q) => sum + Number(q.total), 0);
  const paidValue = approvedQuotes
    .filter((q) => q.paid)
    .reduce((sum, q) => sum + Number(q.total), 0);

  const statusCounts = activeProjects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status as ProjectStatus] = (acc[p.status as ProjectStatus] ?? 0) + 1;
    return acc;
  }, {});

  const stageCounts = openWorkOrders.reduce<Record<string, number>>((acc, wo) => {
    acc[wo.stage as ProductionStage] = (acc[wo.stage as ProductionStage] ?? 0) + 1;
    return acc;
  }, {});

  const monthlyData = buildMonthlyBuckets(activeProjects);
  const recentProjects = projects.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="סקירה כללית"
        description="תמונת מצב כוללת של הפרויקטים, צבר העבודות והייצור בסטודיו."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="פרויקטים פעילים" value={String(activeProjects.length)} />
        <StatCard label="לקוחות" value={String(clients)} />
        <StatCard label="שווי צבר עבודות" value={formatCurrency(pipelineValue)} />
        <StatCard label="בייצור" value={String(openWorkOrders.length)} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>פילוח פרויקטים לפי סטטוס</CardTitle>
            <CardDescription>התפלגות הפרויקטים הפעילים לאורך תהליך העבודה</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineDistribution counts={statusCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>גביית תשלומים</CardTitle>
            <CardDescription>מתוך הצעות מחיר מאושרות</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentDonut paid={paidValue} total={approvedValue} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ערך צבר עבודות לפי חודש</CardTitle>
            <CardDescription>תקציב פרויקטים פעילים, לפי חודש היעד</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyValueChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>התקדמות ייצור</CardTitle>
            <CardDescription>הזמנות עבודה פתוחות לפי שלב</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionBreakdown counts={stageCounts} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>פרויקטים אחרונים</CardTitle>
          <Link
            href="/projects"
            className="text-sm font-medium text-accent hover:underline"
          >
            הצג הכול
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentProjects.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              אין עדיין פרויקטים. צרו לקוח ופרויקט ראשונים כדי להתחיל.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.client.name} · יעד {formatDate(project.targetDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {project.budget ? formatCurrency(Number(project.budget)) : "—"}
                    </span>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
