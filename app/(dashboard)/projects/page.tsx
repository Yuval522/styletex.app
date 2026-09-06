import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const COLUMNS: { status: ProjectStatus; label: string }[] = [
  { status: "LEAD", label: "Lead" },
  { status: "DESIGN", label: "Design" },
  { status: "QUOTED", label: "Quoted" },
  { status: "APPROVED", label: "Approved" },
  { status: "PRODUCTION", label: "Production" },
  { status: "INSTALLATION", label: "Installation" },
  { status: "COMPLETE", label: "Complete" },
];

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      include: { client: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Pipeline across every active engagement."
        action={<NewProjectDialog clients={clients} />}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a client before creating your first project.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = projects.filter((p) => p.status === col.status);
            return (
              <div key={col.status} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </p>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <p className="font-medium text-foreground leading-snug">
                            {project.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {project.client.name}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {project.budget
                                ? formatCurrency(Number(project.budget))
                                : "—"}
                            </span>
                            <span>{formatDate(project.targetDate)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Empty
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
