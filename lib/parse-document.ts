/**
 * Best-effort text extraction + heuristic parsing for uploaded quote /
 * invoice PDFs (הצעת מחיר / חשבונית).
 *
 * There is no OCR engine or external document-AI API configured for this
 * project, so this can only ever read a PDF's embedded text layer — a
 * scanned image with no text layer will yield nothing, and reports that
 * clearly instead of guessing. Everything this returns is meant to pre-fill
 * an editable form for a human to review, never to be trusted blindly.
 *
 * Tuned against two real Styletex documents (a quote and a tax invoice,
 * both produced by the same accounting software template). PDF.js's text
 * extraction for these specific documents has two quirks worth calling out
 * because they shape almost everything below:
 *
 * 1. Every line-item row extracts as
 *    "<qty> <description><unitPrice> <total> <rowIndex><itemIndex>" — the
 *    unit price is glued directly onto the end of the description with no
 *    space, and a bare (non-decimal) row/item index is appended after the
 *    total. Which of the two trailing amounts is the unit price and which
 *    is the total isn't consistently ordered, so both orderings are tried
 *    and validated against qty × unitPrice ≈ total.
 * 2. The two headline totals — "total to pay" and the VAT amount — are
 *    rendered as a separate layer from their own labels: the labels
 *    ("סה"כ לתשלום:", "מע"מ 18.00%") sit right after the line-items table
 *    with no value attached in the text stream, while the actual figures
 *    come out as bare, unlabeled lines near the very end of the document
 *    (after all the boilerplate terms). Same-line keyword matching can
 *    never find these two figures, so a positional fallback is used
 *    instead — see findTrailingOrphanTotals().
 *
 * Uses `unpdf` rather than the more commonly reached-for `pdf-parse`:
 * pdf-parse vendors a very old build of Mozilla's PDF.js that assumes a
 * browser-like environment, and can throw from deep inside its internals
 * on real-world PDFs in a Node serverless function in ways a surrounding
 * try/catch here can't reliably contain. `unpdf` ships a build of PDF.js
 * specifically stripped down and bundled for serverless/edge runtimes —
 * see https://github.com/unjs/unpdf — which is the actively maintained,
 * documented replacement for exactly this failure mode.
 */
import { extractText, getDocumentProxy } from "unpdf";

export type ParsedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ParsedFinancialDocument = {
  /** True once we found a usable text layer at all. */
  hasTextLayer: boolean;
  lineItems: ParsedLineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  /** e.g. "01/000411" — the document's own serial number, if recognized. */
  documentNumber: string | null;
  documentType: "quote" | "invoice" | null;
  /** Short excerpt shown to the user so they can judge extraction quality. */
  textPreview: string;
};

// Requires two decimal digits — every amount in these documents renders as
// X,XXX.XX. That's what lets a real currency figure be told apart from the
// bare row/item-index integers this generator glues onto every line-item
// row, and from a VAT *rate* like the "18.00" in "מע"מ18.00%".
const MONEY = /-?\d{1,3}(?:,\d{3})*\.\d{2}/;
const MONEY_G = new RegExp(MONEY.source, "g");
const ORPHAN_VALUE_LINE = new RegExp(`^${MONEY.source}$`);

const SUBTOTAL_KEYWORDS = ['סה"כ ללא מע"מ', "סכום ביניים", "subtotal"];
const TAX_KEYWORDS = ['מע"מ', "מעמ", "vat", "tax"];
const TOTAL_KEYWORDS = ['סה"כ לתשלום', "לתשלום", "grand total", "total"];

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

/**
 * Same-line "label ... value" search — a fallback for document styles
 * where the amount is printed right next to its label (unlike Styletex's
 * own totals box, see findTrailingOrphanTotals). Requires the strict
 * (decimal) money pattern so it can't mistake a VAT rate or a bare item
 * index for an amount.
 */
function findAmountForKeywords(lines: string[], keywords: string[]): number | null {
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!keywords.some((k) => lower.includes(k.toLowerCase()))) continue;
    const matches = line.match(MONEY_G);
    if (!matches || matches.length === 0) continue;
    const value = toNumber(matches[matches.length - 1]);
    if (!Number.isNaN(value)) return value;
  }
  return null;
}

/**
 * Positional fallback for Styletex's totals box: the "total to pay" and
 * VAT amount consistently come out as the last two "bare number" lines
 * (a line containing nothing but one decimal amount, no label) in the
 * whole document — verified against a real quote and a real invoice, in
 * that order [total, tax] both times.
 */
function findTrailingOrphanTotals(lines: string[]): { total: number | null; tax: number | null } {
  const orphanValues = lines.filter((line) => ORPHAN_VALUE_LINE.test(line)).map(toNumber);
  if (orphanValues.length < 2) return { total: null, tax: null };

  const total = orphanValues[orphanValues.length - 2];
  const tax = orphanValues[orphanValues.length - 1];

  // Sanity check: total > tax > 0 in every real sample. If that doesn't
  // hold we've likely picked up unrelated numbers — better to report
  // "not found" than pre-fill something misleading.
  if (!(total > 0) || !(tax >= 0) || total <= tax) {
    return { total: null, tax: null };
  }
  return { total, tax };
}

/**
 * Looks for table-like rows shaped like Styletex's own line items (see the
 * file-level docstring for the exact text shape). Deliberately
 * conservative: it only accepts a row once quantity × unitPrice checks out
 * against the total (trying both orderings of the two trailing amounts),
 * so a paragraph or a zero-priced section header (e.g. "אופציה א:") never
 * gets mistaken for a priced line item.
 */
function extractLineItems(lines: string[]): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];

  for (const line of lines) {
    const leading = line.match(/^(\d{1,3}(?:,\d{3})*\.\d{2})\s+(.+)$/);
    if (!leading) continue;
    const quantity = toNumber(leading[1]);
    if (!(quantity > 0)) continue;

    // Strip the trailing bare row/item index glued onto every row (a plain
    // integer with no decimal point — real amounts always have one, so
    // this can never be confused with a real value).
    const rest = leading[2].replace(/\s*\d+\s*$/, "");

    const moneyMatches = [...rest.matchAll(MONEY_G)];
    if (moneyMatches.length < 2) continue;

    const first = moneyMatches[moneyMatches.length - 2];
    const second = moneyMatches[moneyMatches.length - 1];
    const a = toNumber(first[0]);
    const b = toNumber(second[0]);

    // Which of the two trailing amounts is the unit price and which is the
    // total isn't consistently ordered in the extracted text, so try both
    // and accept whichever one's arithmetic actually checks out.
    let unitPrice: number;
    const tolerance = (v: number) => Math.max(1, v * 0.02);
    if (Math.abs(quantity * a - b) <= tolerance(b)) {
      unitPrice = a;
    } else if (Math.abs(quantity * b - a) <= tolerance(a)) {
      unitPrice = b;
    } else {
      continue;
    }

    if (unitPrice <= 0) continue;

    const description = rest
      .slice(0, first.index)
      .replace(/[:\-\s]+$/, "")
      .trim();
    if (!description || description.length < 2) continue;

    items.push({ description, quantity, unitPrice });
  }

  return items;
}

function detectDocument(lines: string[]): {
  documentNumber: string | null;
  documentType: "quote" | "invoice" | null;
} {
  for (const line of lines) {
    if (!line.includes("מספר")) continue;
    const numberMatch = line.match(/(\d{2}\/\d{5,6})/);
    if (!numberMatch) continue;
    const documentType = line.includes("חשבונית")
      ? "invoice"
      : line.includes("הצעת מחיר")
        ? "quote"
        : null;
    if (documentType) return { documentNumber: numberMatch[1], documentType };
  }
  return { documentNumber: null, documentType: null };
}

export async function parseFinancialDocument(buffer: Buffer): Promise<ParsedFinancialDocument> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const normalized = text.replace(/\r/g, "");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hasTextLayer = lines.join("").length >= 20;

  if (!hasTextLayer) {
    return {
      hasTextLayer: false,
      lineItems: [],
      subtotal: null,
      tax: null,
      total: null,
      documentNumber: null,
      documentType: null,
      textPreview: "",
    };
  }

  const lineItems = extractLineItems(lines);
  // Summing the line items we actually found is far more reliable than
  // scraping the printed subtotal (which, like the other totals, can sit
  // disconnected from its label) — it's self-consistent with whatever this
  // parse actually recovered.
  const subtotal =
    lineItems.length > 0
      ? Math.round(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100
      : findAmountForKeywords(lines, SUBTOTAL_KEYWORDS);

  const positional = findTrailingOrphanTotals(lines);
  const tax = positional.tax ?? findAmountForKeywords(lines, TAX_KEYWORDS);
  const total = positional.total ?? findAmountForKeywords(lines, TOTAL_KEYWORDS);

  const { documentNumber, documentType } = detectDocument(lines);

  return {
    hasTextLayer: true,
    lineItems,
    subtotal,
    tax,
    total,
    documentNumber,
    documentType,
    textPreview: lines.slice(0, 8).join(" · ").slice(0, 300),
  };
}
