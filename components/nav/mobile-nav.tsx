"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "@/components/nav/sidebar";

type MobileNavUser = { name?: string | null; email?: string | null };

/** Top bar + slide-in drawer shown on small screens only. */
export function MobileNav({ user }: { user?: MobileNavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background font-display text-xs">
            S
          </div>
          <p className="font-brand text-sm text-foreground">Styletex</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="פתח תפריט"
          className="flex size-9 items-center justify-center rounded-md text-foreground hover:bg-surface-muted"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="סגור תפריט"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[80vw] border-e border-border bg-surface shadow-lg">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="סגור תפריט"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} user={user} />
          </div>
        </div>
      )}
    </>
  );
}
