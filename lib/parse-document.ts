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
 * Tuned against four real Styletex documents (three quotes and a tax
 * invoice, all produced by the same accounting software template). PDF.js's
 * text extraction for these specific documents has four quirks worth
 * calling out because they shape almost everything below:
 *
 * 1. Every line-item row extracts as
 *    "<qty> <description><unitPrice> <total> <rowIndex><itemIndex>" — the
 *    unit price is glued directly onto the end of the description with no
 *    space, and a bare (non-decimal) row/item index is appended after the
 *    total. Which of the two trailing amounts is the unit price and which
 *    is the total isn't consistently ordered, so both orderings are tried
 *    and validated against qty × unitPrice ≈ total.
 * 1a. A decimal spec value quoted inside the description (e.g. "לפי מפרט
 *    2.70") sometimes gets glued, with no space at all, directly onto the
 *    row's real price — extracting as "...מפרט 2.705,670.00 2,100.00 30".
 *    A naive money regex reads right through the join and grabs "705,670"
 *    as if it were one number, corrupting the price so badly the qty ×
 *    unitPrice ≈ total check fails and the *entire row* silently drops —
 *    which is worse than it sounds, because the row is then still "open"
 *    waiting to resolve, so it goes on to swallow the *next* real row's
 *    text as if it were just more of its own wrapped description (see 1b).
 *    MONEY is written to refuse to start a match immediately after a
 *    "." or "."+one-digit (i.e. inside someone else's 2-decimal fraction),
 *    which is exactly what forces it to skip past the contaminating digits
 *    and lock onto the real, separate price figure instead.
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
 * 3. A discount, when the document has one, sits in that same disconnected
 *    "values in one place, labels somewhere else" layout as quirk 2, right
 *    after the line-items table: three bare orphan lines in a row —
 *    subtotal-before-discount, the discount amount (in parentheses, e.g.
 *    "(4,113.81)", which this generator's convention is to print as an
 *    implicitly negative number), then subtotal-after-discount — followed
 *    by their three labels ("סה"כ ללא מע"מ:", "סה"כ לתשלום:", "סה"כ לאחר
 *    הנחה:") with no discount % or ₪ mentioned anywhere else. A document
 *    with no discount prints the same three-line shape with the middle
 *    value as a bare "0.00" instead of a parenthesized figure, so treating
 *    the parenthesized form as *implicitly negative* and requiring
 *    before + discount ≈ after (see findDiscountAmount()) handles both
 *    cases with one rule instead of needing a separate "no discount" path.
 *    This discount is subtracted from the line-items subtotal *before*
 *    adding tax — total = subtotal − discount + tax — which is what makes
 *    the final total match the document's own "סה"כ לתשלום" figure;
 *    without it, a discounted document's total comes out too high by
 *    exactly the discount amount.
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
  /** Sum of the line items found — before any discount. */
  subtotal: number | null;
  /** Amount subtracted from `subtotal` before tax; 0 when none was found. */
  discount: number | null;
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
//
// The two lookbehinds refuse to let a match start immediately after a "."
// or after "."+one-digit — i.e. from inside another number's 2-decimal
// fraction. Without this, a spec value glued with zero space onto the
// row's real price (e.g. "...מפרט 2.705,670.00...", see quirk 1a above)
// gets its trailing digits stolen into a bogus, corrupted figure. A
// position exactly two digits after the dot (the normal end of any
// complete money value) is deliberately left unblocked — that's the
// legitimate boundary where the next real number is supposed to start.
const MONEY = /(?<!\.)(?<!\.\d)-?\d{1,3}(?:,\d{3})*\.\d{2}/;
const MONEY_G = new RegExp(MONEY.source, "g");
const ORPHAN_VALUE_LINE = new RegExp(`^${MONEY.source}$`);
// A discount amount prints as the same bare money figure, but wrapped in
// parentheses (e.g. "(4,113.81)") — this generator's convention for "this
// is subtracted", never an actual minus sign.
const ORPHAN_NEGATIVE_VALUE_LINE = new RegExp(`^\\(${MONEY.source}\\)$`);
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
 * Positional detection for a discount, using the same disconnected
 * "values in one place, labels somewhere else" layout as
 * findTrailingOrphanTotals — see quirk 3 in the file-level docstring for
 * the exact three-line shape this looks for (subtotal-before-discount,
 * the discount itself, subtotal-after-discount) and why treating a
 * parenthesized value as implicitly negative lets one arithmetic check
 * cover both the "has a discount" and "no discount at all" cases.
 * Returns 0 (not null) when the document has no discount, so callers can
 * tell "confidently zero" apart from "couldn't find this section at all".
 */
function findDiscountAmount(lines: string[]): number | null {
  const candidates: number[] = [];
  for (const line of lines) {
    if (ORPHAN_VALUE_LINE.test(line)) {
      candidates.push(toNumber(line));
    } else if (ORPHAN_NEGATIVE_VALUE_LINE.test(line)) {
      candidates.push(-toNumber(line.slice(1, -1)));
    }
  }

  for (let i = 0; i + 2 < candidates.length; i++) {
    const before = candidates[i];
    const adjustment = candidates[i + 1];
    const after = candidates[i + 2];
    if (before > 0 && after > 0 && Math.abs(before + adjustment - after) <= Math.max(1, before * 0.02)) {
      return adjustment < 0 ? -adjustment : 0;
    }
  }
  return null;
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
      discount: null,
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

  const discount = findDiscountAmount(lines);

  const positional = findTrailingOrphanTotals(lines);
  const tax = positional.tax ?? findAmountForKeywords(lines, TAX_KEYWORDS);
  const total = positional.total ?? findAmountForKeywords(lines, TOTAL_KEYWORDS);

  const { documentNumber, documentType } = detectDocument(lines);

  return {
    hasTextLayer: true,
    lineItems,
    subtotal,
    discount,
    tax,
    total,
    documentNumber,
    documentType,
    textPreview: lines.slice(0, 8).join(" · ").slice(0, 300),
  };
}
