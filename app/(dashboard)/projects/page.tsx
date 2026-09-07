import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { ProjectStepper, getProjectStages } from "@/components/projects/project-stepper";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      include: {
        client: true,
        quotes: {
          select: {
            id: true,
            status: true,
            paid: true,
            paidAt: true,
            total: true,
            version: true,
          },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="פרויקטים"
        description="ציר זמן אנכי לכל פרויקט — ממעקב לקוח ועד ביצוע."
        action={<NewProjectDialog clients={clients} />}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          הוסיפו לקוח לפני יצירת הפרויקט הראשון.
        </p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          אין עדיין פרויקטים. צרו פרויקט ראשון כדי להתחיל.
        </p>
      ) : (
        <div className="space-y-5">
          {projects.map((project) => {
            const latestQuote = project.quotes[0]
              ? {
                  id: project.quotes[0].id,
                  status: project.quotes[0].status,
                  paid: project.quotes[0].paid,
                  paidAt: project.quotes[0].paidAt,
                  total: Number(project.quotes[0].total),
                }
              : null;

            const stages = getProjectStages({
              client: {
                name: project.client.name,
                email: project.client.email,
                phone: project.client.phone,
              },
              latestQuote,
              projectStatus: project.status,
              startDate: project.startDate,
            });

            return (
              <Card key={project.id}>
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-display text-base text-foreground hover:text-accent"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {project.client.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-end text-xs text-muted-foreground">
                        <p>{project.budget ? formatCurrency(Number(project.budget)) : "—"}</p>
                        <p>{project.targetDate ? formatDate(project.targetDate) : "—"}</p>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                  </div>

                  <ProjectStepper stages={stages} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
