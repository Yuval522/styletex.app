import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StageSelect } from "@/components/production/stage-select";
import { NewWorkOrderDialog } from "@/components/production/new-work-order-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteWorkOrder } from "@/actions/work-orders";
import { formatDate } from "@/lib/utils";
import type { ProductionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAGES: { stage: ProductionStage; label: string }[] = [
  { stage: "CUTTING", label: "חיתוך" },
  { stage: "ASSEMBLY", label: "הרכבה" },
  { stage: "FINISHING", label: "גימור" },
  { stage: "QC", label: "בקרת איכות" },
  { stage: "READY", label: "מוכן" },
];

export default async function ProductionPage() {
  const [workOrders, projects] = await Promise.all([
    prisma.workOrder.findMany({
      include: { project: { include: { client: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="ייצור"
        description="סטטוס רצפת הייצור עבור כל הזמנות העבודה הפתוחות."
        action={
          projects.length > 0 ? (
            <NewWorkOrderDialog projects={projects} />
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          יש ליצור פרויקט לפני הוספת הזמנת עבודה.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const items = workOrders.filter((wo) => wo.stage === col.stage);
            return (
              <div key={col.stage} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </p>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((wo) => (
                    <Card key={wo.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/projects/${wo.projectId}`}
                            className="font-medium text-foreground leading-snug hover:underline"
                          >
                            {wo.project.name}
                          </Link>
                          <DeleteButton
                            onDelete={deleteWorkOrder.bind(null, wo.id)}
                            confirmMessage="למחוק הזמנת עבודה זו? הפעולה אינה הפיכה."
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {wo.project.client.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {wo.assignedTo ?? "לא שויך"} · תאריך יעד {formatDate(wo.dueDate)}
                        </p>
                        <div className="mt-3">
                          <StageSelect workOrderId={wo.id} stage={wo.stage} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      ריק
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
