import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { ProjectStatusSelect } from "@/components/projects/status-select";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { NewRoomDialog } from "@/components/specs/new-room-dialog";
import { NewSpecDialog } from "@/components/specs/new-spec-dialog";
import { NewQuoteDialog } from "@/components/quotes/new-quote-dialog";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { QuotePdfActions } from "@/components/quotes/quote-pdf-actions";
import { NewWorkOrderDialog } from "@/components/production/new-work-order-dialog";
import { StageSelect } from "@/components/production/stage-select";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteProject } from "@/actions/projects";
import { deleteQuote } from "@/actions/quotes";
import { deleteWorkOrder } from "@/actions/work-orders";
import { deleteRoom, deleteCabinetSpec } from "@/actions/specs";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, materials] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        rooms: { include: { specs: { include: { material: true } } } },
        quotes: {
          select: {
            id: true,
            version: true,
            status: true,
            subtotal: true,
            tax: true,
            total: true,
            createdAt: true,
            pdfFileName: true,
            lineItems: true,
          },
          orderBy: { version: "desc" },
        },
        workOrders: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`${project.client.name} · ${
          project.budget ? formatCurrency(Number(project.budget)) : "לא נקבע תקציב"
        } · יעד ${formatDate(project.targetDate)}`}
        action={
          <div className="flex items-center gap-2">
            <EditProjectDialog
              project={{
                id: project.id,
                name: project.name,
                budget: project.budget ? Number(project.budget) : null,
                startDate: project.startDate,
                targetDate: project.targetDate,
              }}
            />
            <ProjectStatusSelect projectId={project.id} status={project.status} />
            <DeleteButton
              onDelete={deleteProject.bind(null, project.id)}
              confirmMessage={`למחוק את הפרויקט "${project.name}"? פעולה זו תמחק גם את החדרים, המפרטים, הצעות המחיר וההזמנות המשויכות ואינה הפיכה.`}
              redirectTo="/projects"
            />
          </div>
        }
      />

      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">מפרט עיצוב</TabsTrigger>
          <TabsTrigger value="quotes">הצעות מחיר</TabsTrigger>
          <TabsTrigger value="production">ייצור</TabsTrigger>
        </TabsList>

        {/* ---------- SPECS ---------- */}
        <TabsContent value="specs">
          <div className="mb-4 flex justify-end">
            <NewRoomDialog projectId={project.id} />
          </div>

          {project.rooms.length === 0 ? (
            <EmptyState message="טרם נוספו חדרים." />
          ) : (
            <div className="space-y-4">
              {project.rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="font-display text-base text-foreground">{room.name}</p>
                      <div className="flex items-center gap-2">
                        <NewSpecDialog
                          projectId={project.id}
                          roomId={room.id}
                          materials={materials}
                        />
                        <DeleteButton
                          onDelete={deleteRoom.bind(null, room.id)}
                          confirmMessage={`למחוק את החדר "${room.name}"? פעולה זו תמחק גם את כל המפרטים בו ואינה הפיכה.`}
                        />
                      </div>
                    </div>
                    {room.specs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">טרם נוספו מפרטים.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {room.specs.map((spec) => (
                          <div key={spec.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                            <div>
                              <p className="font-medium text-foreground">
                                {spec.doorStyle} · {spec.finish}
                              </p>
                              <p className="text-muted-foreground">
                                {Number(spec.width)}&quot; × {Number(spec.height)}&quot; × {Number(spec.depth)}&quot;
                                {spec.material ? ` · ${spec.material.name}` : ""}
                                {spec.hardware ? ` · ${spec.hardware}` : ""}
                              </p>
                            </div>
                            <DeleteButton
                              onDelete={deleteCabinetSpec.bind(null, project.id, spec.id)}
                              confirmMessage="למחוק מפרט זה? הפעולה אינה הפיכה."
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- QUOTES ---------- */}
        <TabsContent value="quotes">
          <div className="mb-4 flex justify-end">
            <NewQuoteDialog projectId={project.id} />
          </div>

          {project.quotes.length === 0 ? (
            <EmptyState message="טרם נוצרו הצעות מחיר." />
          ) : (
            <div className="space-y-4">
              {project.quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-base text-foreground">
                        הצעת מחיר גרסה {quote.version}
                      </p>
                      <div className="flex items-center gap-2">
                        <QuoteStatusBadge status={quote.status} />
                        <QuoteStatusSelect
                          projectId={project.id}
                          quoteId={quote.id}
                          status={quote.status}
                        />
                        <DeleteButton
                          onDelete={deleteQuote.bind(null, quote.id)}
                          confirmMessage="למחוק הצעת מחיר זו? הפעולה אינה הפיכה."
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-border text-sm">
                      {quote.lineItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2">
                          <span>{item.description}</span>
                          <span className="text-muted-foreground">
                            {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))} ={" "}
                            {formatCurrency(Number(item.total))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QuotePdfActions quoteId={quote.id} fileName={quote.pdfFileName} />
                      <p className="text-xs text-muted-foreground">
                        נוצר {formatDate(quote.createdAt)}
                      </p>
                    </div>
                    <div className="mt-3 flex justify-end gap-6 text-sm text-muted-foreground">
                      <span>סכום ביניים {formatCurrency(Number(quote.subtotal))}</span>
                      <span>מע&quot;מ {formatCurrency(Number(quote.tax))}</span>
                      <span className="font-medium text-foreground">
                        סה&quot;כ {formatCurrency(Number(quote.total))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- PRODUCTION ---------- */}
        <TabsContent value="production">
          <div className="mb-4 flex justify-end">
            <NewWorkOrderDialog projectId={project.id} />
          </div>

          {project.workOrders.length === 0 ? (
            <EmptyState message="טרם נוצרו הזמנות עבודה." />
          ) : (
            <div className="space-y-3">
              {project.workOrders.map((wo) => (
                <Card key={wo.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium text-foreground">
                        {wo.assignedTo ?? "לא שויך"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        תאריך יעד {formatDate(wo.dueDate)}
                        {wo.notes ? ` · ${wo.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StageSelect workOrderId={wo.id} stage={wo.stage} />
                      <DeleteButton
                        onDelete={deleteWorkOrder.bind(null, wo.id)}
                        confirmMessage="למחוק הזמנת עבודה זו? הפעולה אינה הפיכה."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
