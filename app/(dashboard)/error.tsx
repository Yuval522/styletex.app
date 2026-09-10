"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary for every page under the dashboard layout
 * (projects, quotes, clients, production, materials, calendar, …). Any
 * unexpected error thrown while rendering a page here — a bad query, a bug
 * in a helper it calls, anything — lands on this friendly Hebrew screen
 * with a retry button, instead of Next's generic English crash page. The
 * sidebar/nav around it (from the dashboard layout) keeps working, so
 * people can navigate away without reloading the whole app.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-status-cancelled/10 text-status-cancelled">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-lg text-foreground">
          משהו השתבש בטעינת העמוד
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          אירעה שגיאה בלתי צפויה. ניתן לנסות שוב, ואם התקלה חוזרת יש לפנות לתמיכה.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground" dir="ltr">
            קוד שגיאה: {error.digest}
          </p>
        )}
      </div>
      <Button type="button" variant="accent" onClick={reset}>
        נסה שוב
      </Button>
    </div>
  );
}
