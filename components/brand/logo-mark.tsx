/**
 * The Styletex brand mark: a minimalist house-outline glyph, matching the
 * redesigned app icon (terracotta glyph on a matte-charcoal chip). Replaces
 * the old plain "S" monogram used in the sidebar, mobile nav, and login
 * screen. Renders in `currentColor` so it always matches whatever
 * text/foreground color its parent chip sets (normally --accent-foreground
 * on a --accent-colored chip).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}
