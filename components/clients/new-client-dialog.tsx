"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient, findClientsByName, type ClientNameMatch } from "@/actions/clients";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<ClientNameMatch[]>([]);

  async function checkDuplicate(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      return;
    }
    try {
      setMatches(await findClientsByName(trimmed));
    } catch {
      // Non-critical — this is a helpful nudge, never a gate on submission.
      setMatches([]);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setMatches([]);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Plus /> לקוח חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>לקוח חדש</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          פרויקט חדש ייווצר ויקושר אוטומטית ללקוח, ותועברו אליו מיד לאחר היצירה.
        </p>
        <form action={createClient} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="ישראל ישראלי"
              onChange={() => {
                if (matches.length > 0) setMatches([]);
              }}
              onBlur={(e) => checkDuplicate(e.target.value)}
            />
          </div>

          {matches.length > 0 && (
            <div className="rounded-md border border-accent-soft bg-accent-soft/40 px-3 py-2.5 text-xs">
              <p className="font-medium text-foreground">
                {matches.length === 1
                  ? `כבר קיים לקוח בשם "${matches[0].name}" במערכת.`
                  : `כבר קיימים ${matches.length} לקוחות בשם "${matches[0].name}" במערכת.`}
              </p>
              <p className="mt-1 text-muted-foreground">
                אם זהו אותו לקוח או אתר עם פרויקט נוסף, אפשר להוסיף פרויקט חדש
                ללקוח הקיים במקום ליצור לקוח כפול — כך מספר פרויקטים נפרדים
                יכולים להתקיים באותו מיקום בלי לפצל את המידע ביניהם. אם מדובר
                בלקוח אחר לגמרי, אפשר להתעלם ולהמשיך ביצירת לקוח חדש.
              </p>
              <ul className="mt-2 space-y-1">
                {matches.map((m) => (
                  <li key={m.id}>
                    <Link href={`/clients/${m.id}`} className="font-medium text-accent hover:underline">
                      {m.name} ←
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      {m.projects.length === 0
                        ? "אין עדיין פרויקטים — הוסיפו פרויקט מדף הלקוח"
                        : m.projects.length === 1
                          ? "פרויקט קיים אחד — ניתן להוסיף פרויקט נוסף מדף הלקוח"
                          : `${m.projects.length} פרויקטים קיימים — ניתן להוסיף פרויקט נוסף מדף הלקוח`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" placeholder="israel@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" name="phone" placeholder="050-1234567" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">כתובת</Label>
            <Input id="address" name="address" placeholder="רחוב הרצל 12, תל אביב" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" placeholder="מקור ההפניה, העדפות…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              צור לקוח ופרויקט
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
