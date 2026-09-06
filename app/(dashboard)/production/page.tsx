import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StageSelect } from "@/components/production/stage-select";
import { formatDate } from "@/lib/utils";
import type { ProductionStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAGES: { stage: ProductionStage; label: string }[] = [
  { stage: "CUTTING", label: "Cutting" },
  { stage: "ASSEMBLY", label: "Assembly" },
  { stage: "FINISHING", label: "Finishing" },
  { stage: "QC", label: "Quality check" },
  { stage: "READY", label: "Ready" },
];

export default async function ProductionPage() {
  const workOrders = await prisma.workOrder.findMany({
    include: { project: { include: { client: true } } },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Production"
        description="Shop floor status across every open work order."
      />

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
                      <Link
                        href={`/projects/${wo.projectId}`}
                        className="font-medium text-foreground leading-snug hover:underline"
                      >
                        {wo.project.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {wo.project.client.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {wo.assignedTo ?? "Unassigned"} · due {formatDate(wo.dueDate)}
                      </p>
                      <div className="mt-3">
                        <StageSelect workOrderId={wo.id} stage={wo.stage} />
                      </div>
                    </CardContent>
                  </Card>
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
    </div>
  );
}
