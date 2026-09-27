import type { MetadataRoute } from "next";

// Next.js file convention: automatically served at /manifest.webmanifest
// and linked from every page's <head> — no manual <link rel="manifest">
// needed. This previously didn't exist at all, so "Add to Home Screen" on
// iOS/Android had no app name, theme color, or icon set to read from.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Styletex Kitchens",
    short_name: "Styletex",
    description: "ניהול פרויקטים למטבחים וארונות בהתאמה אישית",
    start_url: "/",
    display: "standalone",
    background_color: "#1B1917",
    theme_color: "#1B1917",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
