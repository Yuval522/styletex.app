"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { updateClient } from "@/actions/clients";

export function EditClientDialog({
  client,
}: {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateClient(client.id, formData);
      router.refresh();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          aria-label="ערוך לקוח"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>עריכת לקוח</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">שם</Label>
            <Input id="edit-name" name="name" required defaultValue={client.name} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">אימייל</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={client.email ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">טלפון</Label>
              <Input id="edit-phone" name="phone" defaultValue={client.phone ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">כתובת</Label>
            <Input id="edit-address" name="address" defaultValue={client.address ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">הערות</Label>
            <Textarea id="edit-notes" name="notes" defaultValue={client.notes ?? ""} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" variant="accent" disabled={pending}>
              {pending ? "שומר…" : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
