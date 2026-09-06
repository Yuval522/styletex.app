import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewMaterialDialog } from "@/components/materials/new-material-dialog";
import { NewSupplierDialog } from "@/components/materials/new-supplier-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [materials, suppliers] = await Promise.all([
    prisma.material.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Catalog of wood, hardware, and finish options with live cost and stock."
        action={
          <div className="flex gap-2">
            <NewSupplierDialog />
            <NewMaterialDialog suppliers={suppliers} />
          </div>
        }
      />

      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No materials in the catalog yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Supplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => {
              const low =
                m.stockQty != null &&
                m.reorderLevel != null &&
                Number(m.stockQty) <= Number(m.reorderLevel);
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {m.type.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(m.unitCost))} / {m.unit}
                  </TableCell>
                  <TableCell>
                    {m.stockQty != null ? (
                      <span className={low ? "text-status-cancelled font-medium" : ""}>
                        {Number(m.stockQty)} {m.unit}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.supplier?.name ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
