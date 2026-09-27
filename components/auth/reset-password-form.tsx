"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resetPassword } from "@/actions/auth";

const AUTHORIZED_EMAILS = [
  { label: "Yuval — yuvalro123@gmail.com", value: "yuvalro123@gmail.com" },
  { label: "Itamar — itamarknaan@gmail.com", value: "itamarknaan@gmail.com" },
];

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    if (!email) {
      setError("יש לבחור עבור מי מאפסים את הסיסמה.");
      return;
    }
    formData.set("email", email);
    setError(null);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        קביעת סיסמה חדשה לחשבון קיים. הפעולה משפיעה רק על הסיסמה שלכם —
        הלקוחות, הפרויקטים, המסמכים והנתונים האחרים במערכת אינם נגועים כלל.
      </p>

      <div className="space-y-1.5">
        <Label>עבור מי מאפסים סיסמה</Label>
        <Select value={email} onValueChange={setEmail}>
          <SelectTrigger>
            <SelectValue placeholder="בחרו שם" />
          </SelectTrigger>
          <SelectContent>
            {AUTHORIZED_EMAILS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reset-password">סיסמה חדשה</Label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          className="text-end"
          placeholder="8 תווים לפחות"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reset-password-confirm">אימות סיסמה חדשה</Label>
        <Input
          id="reset-password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
          className="text-end"
        />
      </div>

      {error && (
        <p className="rounded-md bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
        {isPending ? "מאפס…" : "איפוס סיסמה והתחברות"}
      </Button>
    </form>
  );
}
