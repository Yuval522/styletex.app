"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted/60 hover:text-foreground disabled:opacity-50 sm:py-2"
    >
      <LogOut className="size-4 shrink-0" />
      {isPending ? "מתנתק…" : "התנתקות"}
    </button>
  );
}
