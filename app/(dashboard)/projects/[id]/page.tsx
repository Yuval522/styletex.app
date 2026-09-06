import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { ProjectStatusSelect } from "@/components/projects/status-select";
import { NewRoomDialog } from "@/components/specs/new-room-dialog";
import { NewSpecDialog } from "@/components/specs/new-spec-dialog";
import { NewQuoteDialog } from "@/components/quotes/new-quote-dialog";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { NewWorkOrderDialog } from "@/components/production/new-work-order-dialog";
import { StageSelect } from "@/components/production/stage-select";
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
        quotes: { include: { lineItems: true }, orderBy: { version: "desc" } },
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
          project.budget ? formatCurrency(Number(project.budget)) : "no budget set"
        } · target ${formatDate(project.targetDate)}`}
        action={<ProjectStatusSelect projectId={project.id} status={project.status} />}
      />

      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">Design specs</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>

        {/* ---------- SPECS ---------- */}
        <TabsContent value="specs">
          <div className="mb-4 flex justify-end">
            <NewRoomDialog projectId={project.id} />
          </div>

          {project.rooms.length === 0 ? (
            <EmptyState message="No rooms added yet." />
          ) : (
            <div className="space-y-4">
              {project.rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-base text-foreground">{room.name}</p>
                      <NewSpecDialog
                        projectId={project.id}
                        roomId={room.id}
                        materials={materials}
                      />
                    </div>
                    {room.specs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No specs yet.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {room.specs.map((spec) => (
                          <div key={spec.id} className="flex items-center justify-between py-3 text-sm">
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
            <EmptyState message="No quotes yet." />
          ) : (
            <div className="space-y-4">
              {project.quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display text-base text-foreground">
                        Quote v{quote.version}
                      </p>
                      <div className="flex items-center gap-2">
                        <QuoteStatusBadge status={quote.status} />
                        <QuoteStatusSelect
                          projectId={project.id}
                          quoteId={quote.id}
                          status={quote.status}
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
                    <div className="mt-3 flex justify-end gap-6 text-sm text-muted-foreground">
                      <span>Subtotal {formatCurrency(Number(quote.subtotal))}</span>
                      <span>Tax {formatCurrency(Number(quote.tax))}</span>
                      <span className="font-medium text-foreground">
                        Total {formatCurrency(Number(quote.total))}
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
            <EmptyState message="No work orders yet." />
          ) : (
            <div className="space-y-3">
              {project.workOrders.map((wo) => (
                <Card key={wo.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium text-foreground">
                        {wo.assignedTo ?? "Unassigned"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(wo.dueDate)}
                        {wo.notes ? ` · ${wo.notes}` : ""}
                      </p>
                    </div>
                    <StageSelect workOrderId={wo.id} stage={wo.stage} />
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
