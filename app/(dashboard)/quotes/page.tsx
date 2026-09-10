import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuoteStatusBadge, InvoiceStatusBadge } from "@/components/shared/status-badge";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { InvoiceStatusSelect } from "@/components/invoices/invoice-status-select";
import { QuotePdfActions } from "@/components/quotes/quote-pdf-actions";
import { InvoicePdfActions } from "@/components/invoices/invoice-pdf-actions";
import { NewQuoteDialog } from "@/components/quotes/new-quote-dialog";
import { NewInvoiceDialog } from "@/components/invoices/new-invoice-dialog";
import { PaymentToggle } from "@/components/quotes/payment-toggle";
import { InvoicePaymentToggle } from "@/components/invoices/invoice-payment-toggle";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteQuote } from "@/actions/quotes";
import { deleteInvoice } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const [quotes, invoices, projects] = await Promise.all([
    prisma.quote.findMany({
      select: {
        id: true,
        version: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        createdAt: true,
        pdfFileName: true,
        paid: true,
        paidAt: true,
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      select: {
        id: true,
        number: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        issuedAt: true,
        dueDate: true,
        paidAt: true,
        pdfFileName: true,
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="מעקב מסמכים"
        description="כל הצעות המחיר והחשבוניות במערכת, לפי לקוח, סטטוס וסכום."
      />

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          יש ליצור פרויקט לפני הוספת הצעת מחיר או חשבונית.
        </p>
      ) : (
        <Tabs defaultValue="quotes">
          <TabsList>
            <TabsTrigger value="quotes">הצעות מחיר</TabsTrigger>
            <TabsTrigger value="invoices">חשבוניות</TabsTrigger>
          </TabsList>

          {/* ---------- QUOTES ---------- */}
          <TabsContent value="quotes">
            <div className="mb-4 flex justify-end">
              <NewQuoteDialog projects={projects} />
            </div>

            {quotes.length === 0 ? (
              <EmptyState message="עדיין אין הצעות מחיר. השתמשו בכפתור למעלה כדי ליצור את הראשונה." />
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
                    <TableHead>תשלום</TableHead>
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
                        {quote.status === "APPROVED" ? (
                          <PaymentToggle quoteId={quote.id} paid={quote.paid} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ממתין לאישור
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${quote.project.id}`}
                            className="whitespace-nowrap text-sm text-accent hover:underline"
                          >
                            צפייה בפרויקט
                          </Link>
                          <DeleteButton
                            onDelete={deleteQuote.bind(null, quote.id)}
                            confirmMessage="למחוק הצעת מחיר זו? הפעולה אינה הפיכה."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* ---------- INVOICES ---------- */}
          <TabsContent value="invoices">
            <div className="mb-4 flex justify-end">
              <NewInvoiceDialog projects={projects} />
            </div>

            {invoices.length === 0 ? (
              <EmptyState message="עדיין אין חשבוניות. השתמשו בכפתור למעלה כדי ליצור את הראשונה." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>לקוח</TableHead>
                    <TableHead>פרויקט</TableHead>
                    <TableHead>מס&apos;</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>סכום</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead>קובץ</TableHead>
                    <TableHead>תשלום</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium text-foreground">
                        {invoice.project.client.name}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${invoice.project.id}`}
                          className="text-sm text-accent hover:underline"
                        >
                          {invoice.project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" dir="ltr">
                        {invoice.number ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <InvoiceStatusBadge status={invoice.status} />
                          <InvoiceStatusSelect
                            projectId={invoice.project.id}
                            invoiceId={invoice.id}
                            status={invoice.status}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(Number(invoice.total))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.issuedAt)}
                        {invoice.dueDate ? ` · יעד ${formatDate(invoice.dueDate)}` : ""}
                      </TableCell>
                      <TableCell>
                        <InvoicePdfActions invoiceId={invoice.id} fileName={invoice.pdfFileName} />
                      </TableCell>
                      <TableCell>
                        <InvoicePaymentToggle
                          invoiceId={invoice.id}
                          paid={invoice.status === "PAID"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${invoice.project.id}`}
                            className="whitespace-nowrap text-sm text-accent hover:underline"
                          >
                            צפייה בפרויקט
                          </Link>
                          <DeleteButton
                            onDelete={deleteInvoice.bind(null, invoice.id)}
                            confirmMessage="למחוק חשבונית זו? הפעולה אינה הפיכה."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      )}
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
