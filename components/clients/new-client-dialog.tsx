"use client";

import { useState } from "react";
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
import { createClient } from "@/actions/clients";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Plus /> לקוח חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>לקוח חדש</DialogTitle>
        </DialogHeader>
        <form action={createClient} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input id="name" name="name" required placeholder="ישראל ישראלי" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              צור לקוח
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
