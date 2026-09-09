"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createInitialAccounts } from "@/actions/setup";

function AccountFields({
  person,
  prefix,
  defaultEmail,
}: {
  person: string;
  prefix: string;
  defaultEmail: string;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <p className="font-medium text-foreground">{person}</p>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}Email`}>אימייל</Label>
        <Input
          id={`${prefix}Email`}
          name={`${prefix}Email`}
          type="email"
          defaultValue={defaultEmail}
          required
          dir="ltr"
          className="text-end"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}Password`}>סיסמה</Label>
          <Input
            id={`${prefix}Password`}
            name={`${prefix}Password`}
            type="password"
            required
            minLength={8}
            dir="ltr"
            className="text-end"
            placeholder="8 תווים לפחות"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}PasswordConfirm`}>אימות סיסמה</Label>
          <Input
            id={`${prefix}PasswordConfirm`}
            name={`${prefix}PasswordConfirm`}
            type="password"
            required
            minLength={8}
            dir="ltr"
            className="text-end"
          />
        </div>
      </div>
    </div>
  );
}

export function SetupForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createInitialAccounts(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <AccountFields person="Yuval" prefix="yuval" defaultEmail="yuvalro123@gmail.com" />
      <AccountFields person="Itamar" prefix="itamar" defaultEmail="Itamarknaan@gmail.com" />

      {error && (
        <p className="rounded-md bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
        {isPending ? "יוצר חשבונות…" : "צור את שני החשבונות"}
      </Button>
    </form>
  );
}
