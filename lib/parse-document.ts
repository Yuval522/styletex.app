/**
 * Best-effort text extraction + heuristic parsing for uploaded quote /
 * invoice PDFs (הצעת מחיר / חשבונית).
 *
 * There is no OCR engine or external document-AI API configured for this
 * project, so this can only ever read a PDF's embedded text layer — a
 * scanned image with no text layer will yield nothing, and reports that
 * clearly instead of guessing. Hebrew RTL PDFs are also a known weak spot:
 * many PDF generators emit Hebrew runs in an order that text-extraction
 * libraries (this one included) read back visually reversed, so line-item
 * detection is inherently approximate. Everything this returns is meant to
 * pre-fill an editable form for a human to review, never to be trusted
 * blindly.
 */

// Imported from the inner module (not the package root) to avoid a footgun
// in pdf-parse's index.js: it runs debug-only filesystem code at import
// time when it thinks it's being run directly rather than required as a
// dependency. See types/pdf-parse.d.ts for the matching ambient module.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ParsedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ParsedQuoteDocument = {
  /** True once we found a usable text layer at all. */
  hasTextLayer: boolean;
  lineItems: ParsedLineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  /** Short excerpt shown to the user so they can judge extraction quality. */
  textPreview: string;
};

const MONEY = /-?\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?/;
const MONEY_TOKEN = new RegExp(`^${MONEY.source}$`);

const SUBTOTAL_KEYWORDS = ["סכום ביניים", "subtotal"];
const TAX_KEYWORDS = ["מע\"מ", 'מע"מ', "מעמ", "vat", "tax"];
const TOTAL_KEYWORDS = ["סה\"כ לתשלום", 'סה"כ לתשלום', "לתשלום", "סה\"כ", 'סה"כ', "grand total", "total"];

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

function findAmountForKeywords(lines: string[], keywords: string[]): number | null {
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!keywords.some((k) => lower.includes(k.toLowerCase()))) continue;
    const matches = line.match(new RegExp(MONEY.source, "g"));
    if (!matches || matches.length === 0) continue;
    // The amount associated with a labeled total/tax line is virtually
    // always the last number on that line (label first, value last —
    // regardless of the line's overall reading direction).
    const value = toNumber(matches[matches.length - 1]);
    if (!Number.isNaN(value)) return value;
  }
  return null;
}

/**
 * Looks for table-like rows: some descriptive text plus two or three
 * numeric tokens (quantity, unit price, [line total]). This is a heuristic
 * over plain extracted text with no real table structure, so it is
 * deliberately conservative — it only returns a row when the numbers are
 * internally consistent, and skips anything ambiguous rather than
 * guessing wrong.
 */
function extractLineItems(lines: string[]): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];

  for (const line of lines) {
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length < 3) continue;

    const numericTokens = tokens.filter((t) => MONEY_TOKEN.test(t));
    const textTokens = tokens.filter((t) => !MONEY_TOKEN.test(t));
    const description = textTokens.join(" ").trim();

    // Need real description text plus 2-3 numbers to have any confidence
    // this is a line item and not a paragraph or a totals row (those are
    // handled separately by findAmountForKeywords).
    if (!description || description.length < 2) continue;
    if (numericTokens.length < 2 || numericTokens.length > 3) continue;
    if (TOTAL_KEYWORDS.some((k) => description.includes(k))) continue;
    if (TAX_KEYWORDS.some((k) => description.includes(k))) continue;
    if (SUBTOTAL_KEYWORDS.some((k) => description.includes(k))) continue;

    const nums = numericTokens.map(toNumber);
    if (nums.some(Number.isNaN)) continue;

    let quantity: number;
    let unitPrice: number;

    if (nums.length === 3) {
      const [a, b, c] = nums;
      // Assume [quantity, unitPrice, lineTotal] and only accept the row if
      // the arithmetic actually checks out (within rounding).
      if (a > 0 && Math.abs(a * b - c) < Math.max(0.5, c * 0.02)) {
        quantity = a;
        unitPrice = b;
      } else {
        continue;
      }
    } else {
      // Two numbers: no reliable way to tell [qty, price] from [price,
      // total] apart, so assume a quantity of 1 and treat the larger
      // number as the price — the safer default for a form the user will
      // review anyway.
      const [a, b] = nums;
      quantity = 1;
      unitPrice = Math.max(a, b);
    }

    if (unitPrice <= 0) continue;

    items.push({ description, quantity, unitPrice });
  }

  return items;
}

export async function parseQuoteDocument(buffer: Buffer): Promise<ParsedQuoteDocument> {
  const { text } = await pdfParse(buffer);
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
      textPreview: "",
    };
  }

  return {
    hasTextLayer: true,
    lineItems: extractLineItems(lines),
    subtotal: findAmountForKeywords(lines, SUBTOTAL_KEYWORDS),
    tax: findAmountForKeywords(lines, TAX_KEYWORDS),
    total: findAmountForKeywords(lines, TOTAL_KEYWORDS),
    textPreview: lines.slice(0, 8).join(" · ").slice(0, 300),
  };
}
