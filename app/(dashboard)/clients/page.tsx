import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
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
        title="Clients"
        description="Every household and account on the books."
        action={<NewClientDialog />}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clients yet — add your first client to start a project.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Projects</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
