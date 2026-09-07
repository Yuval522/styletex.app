import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { QuotePdfActions } from "@/components/quotes/quote-pdf-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    omit: { pdfData: true },
    include: {
      project: { include: { client: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="מעקב הצעות מחיר"
        description="כל הצעות המחיר במערכת, לפי לקוח, סטטוס וסכום."
      />

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          עדיין אין הצעות מחיר. ניתן ליצור הצעת מחיר חדשה מתוך עמוד הפרויקט.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>לקוח</TableHead>
              <TableHead>פרויקט</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>קובץ</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium text-foreground">
                  {quote.project.client.name}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/projects/${quote.project.id}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {quote.project.name} · גרסה {quote.version}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <QuoteStatusBadge status={quote.status} />
                    <QuoteStatusSelect
                      projectId={quote.project.id}
                      quoteId={quote.id}
                      status={quote.status}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatCurrency(Number(quote.total))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(quote.createdAt)}
                </TableCell>
                <TableCell>
                  <QuotePdfActions quoteId={quote.id} fileName={quote.pdfFileName} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/projects/${quote.project.id}`}
                    className="text-sm text-accent hover:underline"
                  >
                    צפייה בפרויקט
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
