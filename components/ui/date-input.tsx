"use client";

import { useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Localized date field: shows/edits DD/MM/YYYY (Israeli format) while
 * keeping the underlying value as an ISO yyyy-mm-dd string in a hidden
 * input, so existing Server Actions (which parse `new Date(isoString)`)
 * keep working unchanged. A transparent native date input sits over the
 * calendar icon so clicking it opens the browser's own date picker,
 * which stays in sync with the typed text.
 *
 * The visible text is rendered LTR (digits read left-to-right), so inside
 * an RTL page the calendar icon sits on the "start" side (the right edge
 * under RTL) — the opposite edge from where the digits begin — so the two
 * never overlap.
 */

function isoToDisplay(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function displayToIso(display: string) {
  const match = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function formatTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateInput({
  name,
  defaultValue,
  required,
  id,
  className,
  placeholder = "יום/חודש/שנה",
}: {
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [display, setDisplay] = useState(() => isoToDisplay(defaultValue ?? ""));
  const [iso, setIso] = useState(() => (defaultValue ? defaultValue.slice(0, 10) : ""));

  function setFromIso(nextIso: string) {
    setIso(nextIso);
    setDisplay(isoToDisplay(nextIso));
  }

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" name={name} value={iso} />
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        dir="ltr"
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="flex h-9 w-full items-center rounded-md border border-border bg-surface ps-9 pe-3 py-1 text-start text-[0.9rem] leading-9 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground placeholder:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        value={display}
        onChange={(e) => {
          const formatted = formatTyping(e.target.value);
          setDisplay(formatted);
          setIso(displayToIso(formatted));
        }}
      />
      <CalendarDays className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="date"
        tabIndex={-1}
        aria-label="בחר תאריך מלוח שנה"
        className="absolute start-0 top-0 h-full w-9 cursor-pointer opacity-0"
        value={iso}
        onChange={(e) => setFromIso(e.target.value)}
      />
    </div>
  );
}
