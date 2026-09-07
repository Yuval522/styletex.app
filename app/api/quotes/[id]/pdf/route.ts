import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { pdfData: true, pdfMimeType: true, pdfFileName: true },
  });

  if (!quote?.pdfData) {
    return new NextResponse("קובץ לא נמצא", { status: 404 });
  }

  const fileName = quote.pdfFileName ?? "quote.pdf";

  return new NextResponse(new Uint8Array(quote.pdfData), {
    headers: {
      "Content-Type": quote.pdfMimeType ?? "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
