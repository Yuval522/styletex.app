import type { Metadata, Viewport } from "next";
import { Rubik, Fraunces } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Styletex Kitchens",
  description: "ניהול פרויקטים למטבחים וארונות בהתאמה אישית",
};

// Explicit rather than relying on Next's default: this app is used from
// phones and tablets as much as from a desktop, so a correct, un-zoomed
// mobile viewport is load-bearing, not an afterthought.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
