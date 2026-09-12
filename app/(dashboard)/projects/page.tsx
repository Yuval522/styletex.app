import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ProjectStatusSelect } from "@/components/projects/status-select";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStepper } from "@/components/projects/project-stepper";
import { getProjectStages, type Stage } from "@/components/projects/project-stages";
import { ClientParallelTimeline } from "@/components/projects/client-parallel-timeline";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteProject } from "@/actions/projects";
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

  // Group by client so multiple distinct projects belonging to the same
  // client/location (e.g. two separate jobs under "מרכז אנרגיה") show
  // together under one heading instead of being scattered through a flat,
  // updatedAt-ordered list. The data model has always allowed any number of
  // projects per client (Client.projects is one-to-many, no unique
  // constraint) — this only changes how the existing data is displayed.
  // Each group surfaces at the position of its most-recently-updated
  // project, since `projects` above is already ordered by updatedAt desc
  // and groups are built by first-seen order.
  const groupedProjects: { client: (typeof projects)[number]["client"]; projects: typeof projects }[] = [];
  const groupIndexByClientId = new Map<string, number>();
  for (const project of projects) {
    const existingIndex = groupIndexByClientId.get(project.clientId);
    if (existingIndex !== undefined) {
      groupedProjects[existingIndex].projects.push(project);
    } else {
      groupIndexByClientId.set(project.clientId, groupedProjects.length);
      groupedProjects.push({ client: project.client, projects: [project] });
    }
  }

  // Computed once per project up front so the same Stage[] can back both
  // that project's own card timeline and, for clients with more than one
  // project, the "parallel timeline" comparison dialog — without deriving
  // the lifecycle stages for a project twice.
  const stagesByProjectId = new Map<string, Stage[]>();
  for (const project of projects) {
    const latestQuote = project.quotes[0]
      ? {
          id: project.quotes[0].id,
          status: project.quotes[0].status,
          paid: project.quotes[0].paid,
          paidAt: project.quotes[0].paidAt,
          total: Number(project.quotes[0].total),
        }
      : null;

    stagesByProjectId.set(
      project.id,
      getProjectStages({
        client: {
          name: project.client.name,
          email: project.client.email,
          phone: project.client.phone,
        },
        latestQuote,
        projectStatus: project.status,
        startDate: project.startDate,
        overrides:
          project.checkpointOverrides && typeof project.checkpointOverrides === "object"
            ? (project.checkpointOverrides as Record<string, boolean>)
            : {},
      })
    );
  }

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
        <div className="space-y-8">
          {groupedProjects.map(({ client, projects: clientProjects }) => (
            <div key={client.id}>
              {clientProjects.length > 1 && (
                <ClientParallelTimeline
                  clientName={client.name}
                  projects={clientProjects.map((project) => ({
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    budget: project.budget ? Number(project.budget) : null,
                    targetDate: project.targetDate,
                    stages: stagesByProjectId.get(project.id)!,
                  }))}
                />
              )}
              <div className="space-y-5">
                {clientProjects.map((project) => {
                  const stages = stagesByProjectId.get(project.id)!;

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
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-end text-xs text-muted-foreground">
                              <p>{project.budget ? formatCurrency(Number(project.budget)) : "—"}</p>
                              <p>{project.targetDate ? formatDate(project.targetDate) : "—"}</p>
                            </div>
                            <ProjectStatusSelect projectId={project.id} status={project.status} />
                            <EditProjectDialog
                              project={{
                                id: project.id,
                                name: project.name,
                                budget: project.budget ? Number(project.budget) : null,
                                startDate: project.startDate,
                                targetDate: project.targetDate,
                                notes: project.notes,
                              }}
                            />
                            <DeleteButton
                              onDelete={deleteProject.bind(null, project.id)}
                              confirmMessage={`למחוק את הפרויקט "${project.name}"? פעולה זו תמחק גם את החדרים, המפרטים, הצעות המחיר וההזמנות המשויכות ואינה הפיכה.`}
                            />
                          </div>
                        </div>

                        <ProjectStepper projectId={project.id} stages={stages} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
