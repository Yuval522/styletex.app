"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/actions/auth";

export function LoginForm({
  onSwitchToSignup,
  onSwitchToReset,
}: {
  onSwitchToSignup?: () => void;
  onSwitchToReset?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsSignup, setNeedsSignup] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setNeedsSignup(false);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setNeedsSignup(Boolean(result.needsSignup));
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
          className="text-end"
          placeholder="name@styletex.app"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="text-end"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="space-y-2 rounded-md bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
          <p>{error}</p>
          {needsSignup && onSwitchToSignup && (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="block font-medium underline underline-offset-2 hover:no-underline"
            >
              מעבר ללשונית ״הרשמה״
            </button>
          )}
          {!needsSignup && onSwitchToReset && (
            <button
              type="button"
              onClick={onSwitchToReset}
              className="block font-medium underline underline-offset-2 hover:no-underline"
            >
              שכחתי סיסמה — איפוס סיסמה
            </button>
          )}
        </div>
      )}

      <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
        {isPending ? "מתחבר…" : "התחברות"}
      </Button>
    </form>
  );
}
