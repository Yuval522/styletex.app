import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="לקוחות"
        description="כל משק בית וחשבון הרשומים במערכת."
        action={<NewClientDialog />}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          אין עדיין לקוחות — הוסיפו לקוח ראשון כדי להתחיל פרויקט.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>לקוח</TableHead>
              <TableHead>פרטי קשר</TableHead>
              <TableHead>כתובת</TableHead>
              <TableHead>פרויקטים</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent">
                      {initials(client.name)}
                    </span>
                    <span className="font-medium text-foreground">{client.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{client.email ?? "—"}</p>
                    <p className="text-muted-foreground">{client.phone ?? ""}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {client.address ?? "—"}
                </TableCell>
                <TableCell>{client._count.projects}</TableCell>
                <TableCell>
                  <EditClientDialog client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
