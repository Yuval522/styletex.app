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
import { createSupplier } from "@/actions/materials";

export function NewSupplierDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> ספק חדש
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ספק חדש</DialogTitle>
        </DialogHeader>
        <form action={createSupplier} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input id="name" name="name" required placeholder="נגריית הצפון" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact">איש קשר</Label>
            <Input id="contact" name="contact" placeholder="דנה כהן" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent">
              הוסף ספק
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
