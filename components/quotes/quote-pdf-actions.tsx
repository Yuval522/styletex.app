"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachQuotePdf, removeQuotePdf } from "@/actions/quotes";

export function QuotePdfActions({
  quoteId,
  fileName,
}: {
  quoteId: string;
  fileName: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("ניתן לצרף קובץ PDF בלבד");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("pdf", file);
    startTransition(async () => {
      try {
        await attachQuotePdf(quoteId, formData);
        router.refresh();
      } catch {
        setError("העלאת הקובץ נכשלה");
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      await removeQuotePdf(quoteId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {fileName ? (
          <>
            <a
              href={`/api/quotes/${quoteId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              title={fileName}
            >
              <FileText className="size-4 shrink-0" />
              <span className="max-w-[10rem] truncate">{fileName}</span>
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={isPending}
              onClick={handleRemove}
              aria-label="הסר קובץ PDF"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload /> {isPending ? "מעלה…" : "העלה PDF"}
          </Button>
        )}
        {fileName && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? "מעלה…" : "החלף"}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-status-cancelled">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
