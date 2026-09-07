import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteClient } from "@/actions/clients";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={client.name}
        description={[client.email, client.phone, client.address]
          .filter(Boolean)
          .join(" · ") || "אין פרטי קשר במערכת"}
        action={
          <div className="flex items-center gap-2">
            <NewProjectDialog clients={[client]} defaultClientId={client.id} />
            <DeleteButton
              onDelete={deleteClient.bind(null, client.id)}
              confirmMessage={`למחוק את הלקוח "${client.name}"? פעולה זו תמחק גם את כל הפרויקטים, ההצעות והאירועים המשויכים אליו ואינה הפיכה.`}
              redirectTo="/clients"
            />
          </div>
        }
      />

      {client.notes && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              הערות
            </p>
            <p className="mt-1.5 text-sm text-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 font-display text-lg text-foreground">פרויקטים</h2>
      {client.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          אין עדיין פרויקטים ללקוח זה.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {client.projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.budget ? formatCurrency(Number(project.budget)) : "לא נקבע תקציב"}
                    {" · "}
                    יעד {formatDate(project.targetDate)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
