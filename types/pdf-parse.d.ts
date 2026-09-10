// `pdf-parse` ships no type declarations at all (not even for its main
// entry point). We import its inner module directly (see lib/parse-document.ts)
// to sidestep a known footgun in the package's index.js — which runs
// debug-only file-system code at import time when it thinks it's being run
// directly instead of required as a dependency — so we declare that inner
// path here rather than the package root.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PdfParseResult>;

  export = pdfParse;
}
