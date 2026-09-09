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
import { registerAccount } from "@/actions/auth";

const AUTHORIZED_EMAILS = [
  { label: "Yuval — yuvalro123@gmail.com", value: "yuvalro123@gmail.com" },
  { label: "Itamar — itamarknaan@gmail.com", value: "itamarknaan@gmail.com" },
];

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    if (!email) {
      setError("יש לבחור עבור מי נרשמים.");
      return;
    }
    formData.set("email", email);
    setError(null);
    startTransition(async () => {
      const result = await registerAccount(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ההרשמה זמינה רק לצוות Styletex Kitchens. בחרו את שמכם וקבעו סיסמה —
        לאחר ההרשמה תתחברו אוטומטית.
      </p>

      <div className="space-y-1.5">
        <Label>עבור מי נרשמים</Label>
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
        <Label htmlFor="signup-password">סיסמה</Label>
        <Input
          id="signup-password"
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
        <Label htmlFor="signup-password-confirm">אימות סיסמה</Label>
        <Input
          id="signup-password-confirm"
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
        {isPending ? "נרשם…" : "הרשמה"}
      </Button>
    </form>
  );
}
