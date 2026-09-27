import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, dir = "rtl", ...props }, ref) => {
  // See the matching comment in components/ui/input.tsx — native form
  // controls need an explicit dir attribute on mobile, not just inherited
  // CSS direction, or Hebrew text can render/caret as if it were LTR.
  return (
    <textarea
      dir={dir}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
