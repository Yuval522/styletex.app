import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  // The business operates exclusively in Israeli New Shekels — ILS (₪),
  // never USD ($). This is the one shared formatter used for every amount
  // across the app (budgets, quotes, invoices, line items, dashboard
  // totals), so fixing it here fixes it everywhere.
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  // Wrapped in Unicode isolate marks (LRI ... PDI) so the numeric
  // DD/MM/YYYY sequence never visually reorders inside RTL text flow.
  return `⁦${day}/${month}/${year}⁩`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
