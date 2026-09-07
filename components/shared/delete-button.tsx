"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Reusable delete action: confirms with the user, calls a bound Server
 * Action, then refreshes the current route (or navigates elsewhere when
 * the deleted record IS the current page, e.g. a project detail view).
 */
export function DeleteButton({
  onDelete,
  confirmMessage = "האם למחוק פריט זה? הפעולה אינה הפיכה.",
  label,
  size = "icon",
  variant = "ghost",
  redirectTo,
  className,
}: {
  onDelete: () => Promise<unknown>;
  confirmMessage?: string;
  label?: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "destructive";
  redirectTo?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && !window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      try {
        await onDelete();
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "המחיקה נכשלה");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        size={label ? size === "icon" ? "sm" : size : size}
        onClick={handleClick}
        disabled={isPending}
        aria-label={label ?? "מחק"}
        className={cn(
          variant === "destructive" ? "" : "text-status-cancelled hover:text-status-cancelled",
          className
        )}
      >
        <Trash2 className="size-4" />
        {label && <span>{isPending ? "מוחק…" : label}</span>}
      </Button>
      {error && <p className="max-w-[12rem] text-xs text-status-cancelled">{error}</p>}
    </div>
  );
}
