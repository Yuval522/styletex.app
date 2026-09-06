import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { NewMaterialDialog } from "@/components/materials/new-material-dialog";
import { NewSupplierDialog } from "@/components/materials/new-supplier-dialog";
import { EditMaterialDialog } from "@/components/materials/edit-material-dialog";
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

const TYPE_LABEL: Record<string, string> = {
  WOOD: "עץ",
  LAMINATE: "למינציה",
  COUNTERTOP: "משטח עבודה",
  HARDWARE: "אביזרים",
  FINISH: "גימור",
  OTHER: "אחר",
};

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
        title="חומרים"
        description="קטלוג עצים, אביזרים וגימורים עם עלות ומלאי בזמן אמת."
        action={
          <div className="flex gap-2">
            <NewSupplierDialog />
            <NewMaterialDialog suppliers={suppliers} />
          </div>
        }
      />

      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">טרם נוספו חומרים לקטלוג.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>חומר</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>עלות ליחידה</TableHead>
              <TableHead>מלאי</TableHead>
              <TableHead>ספק</TableHead>
              <TableHead className="w-10" />
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
                    <Badge variant="outline">
                      {TYPE_LABEL[m.type] ?? m.type}
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
                  <TableCell>
                    <EditMaterialDialog
                      material={{
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        unitCost: Number(m.unitCost),
                        unit: m.unit,
                        stockQty: m.stockQty != null ? Number(m.stockQty) : null,
                        reorderLevel: m.reorderLevel != null ? Number(m.reorderLevel) : null,
                        supplierId: m.supplierId,
                      }}
                      suppliers={suppliers}
                    />
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
