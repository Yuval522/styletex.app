import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarClient } from "@/components/calendar/calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [events, projects] = await Promise.all([
    prisma.calendarEvent.findMany({
      include: {
        project: { include: { client: { select: { name: true } } } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="לוח שנה"
        description="תזמון ומעקב אחר מדידות, פגישות, ייצור והתקנות."
      />
      <CalendarClient events={events} projects={projects} />
    </div>
  );
}
