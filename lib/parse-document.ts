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
 * Tuned against three real Styletex documents (two quotes and a tax
 * invoice, all produced by the same accounting software template). PDF.js's
 * text extraction for these specific documents has three quirks worth
 * calling out because they shape almost everything below:
 *
 * 1. Every line-item row extracts as
 *    "<qty> <description><unitPrice> <total> <rowIndex><itemIndex>" — the
 *    unit price is glued directly onto the end of the description with no
 *    space, and a bare (non-decimal) row/item index is appended after the
 *    total. Which of the two trailing amounts is the unit price and which
 *    is the total isn't consistently ordered, so both orderings are tried
 *    and validated against qty × unitPrice ≈ total.
 * 1b. When a row's description is long, PDF.js wraps it across multiple
 *    extracted lines and only the *last* of those lines carries the
 *    "<unitPrice> <total> <index>" tail — e.g. a real row can extract as
 *    three separate lines: "1.00 בנית דלפק 90/40/1.60 רגל נרוסטה בצד אחד,
 *    ארונית מגירות רוחב", then "50 ס"מ עפ"י תוכנית אדריכל", then
 *    "5,800.00 5,800.00 30". extractLineItems() therefore keeps a row
 *    "pending" and keeps appending lines to it until the accumulated text
 *    ends in that exact trailing shape, rather than requiring it all on one
 *    line — see the trailing-anchor comment on TRAILING_PRICE below for why
 *    the match must be anchored to the very end of the accumulated text
 *    (a wrapped description can itself contain incidental decimal-looking
 *    numbers, e.g. cabinet dimensions, that must not be mistaken for the
 *    row's real price).
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
const LEADING_QTY = /^(\d{1,3}(?:,\d{3})*\.\d{2})\s+(.+)$/;
// A row's own price+total always sit at the very end of the text the row
// extracts as — "<unitPrice-or-total> <the other one> <bare index>" with
// nothing after it. Anchoring to end-of-string (rather than just grabbing
// the last two money-shaped numbers anywhere in the text) is what lets a
// genuine trailing total be told apart from an incidental decimal number
// buried in a wrapped, multi-line description — e.g. a cabinet dimension
// like "90/40/1.60" or a measurement such as "3.38" mid-sentence never
// happens to be followed immediately by a bare integer at the true end of
// the accumulated row text, so it can never falsely satisfy this pattern.
const TRAILING_PRICE = new RegExp(`(${MONEY.source})\\s+(${MONEY.source})\\s+\\d+\\s*$`);

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
 * Given the text accumulated so far for one candidate row (starting right
 * after its leading quantity token, with any wrapped continuation lines
 * already appended), tries to resolve it to a unit price. Returns null if
 * the text doesn't yet end in a real trailing price+total+index — meaning
 * either this isn't a priced row at all, or (for a still-accumulating
 * multi-line row) more lines are needed before it can be resolved.
 */
function tryResolveRow(quantity: number, text: string): { description: string; unitPrice: number } | null {
  const match = text.match(TRAILING_PRICE);
  if (!match) return null;

  const a = toNumber(match[1]);
  const b = toNumber(match[2]);

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
    return null;
  }

  const description = text
    .slice(0, match.index)
    .replace(/[:\-\s]+$/, "")
    .trim();

  return { description, unitPrice };
}

// A wrapped row's continuation almost always closes within a couple of
// lines (a long description plus, at most, one more measurement line) —
// this just bounds how long a never-resolving pending row is allowed to
// keep swallowing unrelated following lines before it's given up on.
const MAX_CONTINUATION_LINES = 5;

/**
 * Looks for table-like rows shaped like Styletex's own line items (see the
 * file-level docstring for the exact text shape). Deliberately
 * conservative: it only accepts a row once quantity × unitPrice checks out
 * against the total (trying both orderings of the two trailing amounts),
 * so a paragraph or a zero-priced section header (e.g. "אופציה א:") never
 * gets mistaken for a priced line item.
 *
 * A long description makes PDF.js wrap a single row across multiple
 * extracted lines, with the "<unitPrice> <total> <index>" tail only
 * showing up on the last of them — so a row that doesn't resolve on its
 * first line is kept "pending" and subsequent lines are appended to it
 * (rather than re-matched as their own row) until the accumulated text
 * ends in that trailing shape.
 */
type PendingRow = { quantity: number; parts: string[]; linesSinceStart: number };

function extractLineItems(lines: string[]): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  let pending: PendingRow | null = null;

  // Checks whether `line` starts a fresh row, pushing it to `items` if it
  // resolves immediately (single-line row) and returning a new pending
  // row to accumulate into otherwise. Returns null if `line` doesn't start
  // a row at all.
  const tryStartFreshRow = (line: string): PendingRow | null => {
    const leading = line.match(LEADING_QTY);
    if (!leading) return null;
    const quantity = toNumber(leading[1]);
    if (!(quantity > 0)) return null;

    const attempt = tryResolveRow(quantity, leading[2]);
    if (attempt) {
      if (attempt.unitPrice > 0 && attempt.description.length >= 2) {
        items.push({ description: attempt.description, quantity, unitPrice: attempt.unitPrice });
      }
      return null;
    }
    // Not resolvable on this line alone — open a pending row in case its
    // price+total land on a following line instead.
    return { quantity, parts: [leading[2]], linesSinceStart: 0 };
  };

  for (const line of lines) {
    if (pending) {
      pending.parts.push(line);
      pending.linesSinceStart += 1;

      const attempt = tryResolveRow(pending.quantity, pending.parts.join(" "));
      if (attempt) {
        if (attempt.unitPrice > 0 && attempt.description.length >= 2) {
          items.push({ description: attempt.description, quantity: pending.quantity, unitPrice: attempt.unitPrice });
        }
        pending = null;
        continue;
      }

      if (pending.linesSinceStart > MAX_CONTINUATION_LINES) {
        // Gave this row enough lines to resolve and it never did — give up
        // on it, but still let this same line have a shot at starting a
        // fresh row of its own below.
        pending = null;
      } else {
        continue;
      }
    }

    pending = tryStartFreshRow(line);
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
