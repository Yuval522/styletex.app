import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TimelineItem =
  | { type: "month"; key: string; label: string }
  | {
      type: "project";
      key: string;
      project: {
        id: string;
        name: string;
        status: string;
        budget: number | null;
        startDate: Date | null;
        targetDate: Date | null;
        client: { name: string };
      };
    };

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(date);
}

export default async function ProjectsPage() {
  const [projectsRaw, clients] = await Promise.all([
    prisma.project.findMany({
      include: { client: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Order chronologically by the most meaningful date each project has:
  // target date first, then start date, falling back to when it was created.
  const projects = [...projectsRaw].sort((a, b) => {
    const dateA = (a.targetDate ?? a.startDate ?? a.createdAt).getTime();
    const dateB = (b.targetDate ?? b.startDate ?? b.createdAt).getTime();
    return dateA - dateB;
  });

  const items: TimelineItem[] = [];
  let currentMonthKey: string | null = null;

  for (const project of projects) {
    const timelineDate = project.targetDate ?? project.startDate ?? project.createdAt;
    const key = monthKey(timelineDate);
    if (key !== currentMonthKey) {
      items.push({ type: "month", key, label: monthLabel(timelineDate) });
      currentMonthKey = key;
    }
    items.push({
      type: "project",
      key: project.id,
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget ? Number(project.budget) : null,
        startDate: project.startDate,
        targetDate: project.targetDate,
        client: { name: project.client.name },
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="פרויקטים"
        description="ציר זמן של כל הפרויקטים, ממוין לפי תאריך היעד או ההתחלה."
        action={<NewProjectDialog clients={clients} />}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          הוסיפו לקוח לפני יצירת הפרויקט הראשון.
        </p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          אין עדיין פרויקטים. צרו פרויקט ראשון כדי להתחיל את ציר הזמן.
        </p>
      ) : (
        <ol className="max-w-2xl">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {item.type === "month" ? (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                      •
                    </span>
                  ) : (
                    <span className="mt-2.5 size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-background" />
                  )}
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>

                {item.type === "month" ? (
                  <div className="pb-3 pt-0.5">
                    <h2 className="font-display text-base text-foreground">{item.label}</h2>
                  </div>
                ) : (
                  <div className="w-full pb-6">
                    <Link href={`/projects/${item.project.id}`}>
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium leading-snug text-foreground">
                                {item.project.name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.project.client.name}
                              </p>
                            </div>
                            <ProjectStatusBadge status={item.project.status} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {item.project.budget
                                ? formatCurrency(item.project.budget)
                                : "—"}
                            </span>
                            <span>
                              {item.project.startDate ? formatDate(item.project.startDate) : "—"}
                              {" – "}
                              {item.project.targetDate ? formatDate(item.project.targetDate) : "—"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
