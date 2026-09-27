import { ImageResponse } from "next/og";

// Next.js file convention: a file at app/apple-icon.tsx is automatically
// rendered to a PNG and wired up as <link rel="apple-touch-icon"> — this is
// the piece that was entirely missing before (there was no favicon,
// apple-touch-icon, or manifest anywhere in this codebase), which is why
// iOS had nothing new to pick up when saving the site to the home screen.
// iOS masks this into its own rounded-square shape itself, so the artwork
// is left as a plain square — no corner radius needed here.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B1917",
        }}
      >
        <svg
          width="108"
          height="108"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#DD8259"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
          <path d="M10 20v-5h4v5" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
