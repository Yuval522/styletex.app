import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [projects, clients, quotes, workOrders] = await Promise.all([
    prisma.project.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count(),
    prisma.quote.findMany({ where: { status: "APPROVED" } }),
    prisma.workOrder.findMany({ where: { stage: { not: "READY" } } }),
  ]);

  const activeProjects = projects.filter(
    (p) => !["COMPLETE", "CANCELLED"].includes(p.status)
  );
  const pipelineValue = activeProjects.reduce(
    (sum, p) => sum + Number(p.budget ?? 0),
    0
  );
  const approvedValue = quotes.reduce((sum, q) => sum + Number(q.total), 0);

  const recentProjects = projects.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Studio-wide snapshot of projects, pipeline, and production."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active projects" value={String(activeProjects.length)} />
        <StatCard label="Clients" value={String(clients)} />
        <StatCard label="Pipeline value" value={formatCurrency(pipelineValue)} />
        <StatCard label="In production" value={String(workOrders.length)} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent projects</CardTitle>
          <Link
            href="/projects"
            className="text-sm font-medium text-accent hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentProjects.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              No projects yet. Create your first client and project to get started.
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
                      {project.client.name} · target {formatDate(project.targetDate)}
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

      <div className="mt-4 text-sm text-muted-foreground">
        {formatCurrency(approvedValue)} in approved quotes awaiting production.
      </div>
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
