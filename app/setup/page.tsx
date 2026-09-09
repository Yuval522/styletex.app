import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "@/components/auth/setup-form";

export const metadata = {
  title: "הגדרה ראשונית · Styletex Kitchens",
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existingCount = await prisma.user.count();
  const alreadyDone = existingCount > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-md bg-foreground text-background font-display text-lg">
            S
          </div>
          <div>
            <p className="font-brand text-xl text-foreground">Styletex</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Kitchens &amp; Cabinetry
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          {alreadyDone ? (
            <>
              <h1 className="mb-1 text-lg font-semibold text-foreground">
                ההגדרה הראשונית כבר בוצעה
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                כבר קיימים חשבונות במערכת, כך שעמוד זה נעול כעת מטעמי אבטחה.
              </p>
              <Link
                href="/login"
                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                מעבר להתחברות
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-semibold text-foreground">
                הגדרה ראשונית — יצירת חשבונות התחברות
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                עמוד זה זמין רק כל עוד אין חשבונות במערכת. קבעו סיסמה לכל אחד
                מהחשבונות; עמוד זה יינעל אוטומטית ברגע שהחשבונות ייווצרו.
              </p>
              <SetupForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
