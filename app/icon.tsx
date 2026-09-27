import { ImageResponse } from "next/og";

// Next.js file convention: a file at app/icon.tsx is automatically rendered
// to a PNG and wired up as the app's favicon (<link rel="icon">) — no
// static image asset needed. Colors are the literal brand hexes rather
// than the CSS variables in globals.css, since this renders server-side,
// outside any browser CSS context.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          width="304"
          height="304"
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
