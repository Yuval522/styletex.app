import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, dir = "rtl", ...props }, ref) => {
    // Mobile browsers (iOS Safari in particular) don't reliably inherit the
    // page's `direction` for native form controls — an empty <input> can
    // fall back to its own left-to-right default and only pick up RTL once
    // enough strong-direction characters have been typed, which reads as
    // "typing backwards" for Hebrew. Setting `dir` explicitly on the
    // element itself (not just via CSS inheritance) fixes that. Fields
    // with genuinely LTR content (email, phone, dates) already pass
    // dir="ltr" explicitly, which overrides this default.
    return (
      <input
        type={type}
        dir={dir}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground placeholder:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
