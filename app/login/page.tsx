import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "התחברות · Styletex Kitchens",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
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
          <h1 className="mb-1 text-lg font-semibold text-foreground">
            התחברות למערכת
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            הזינו את פרטי ההתחברות שלכם כדי להמשיך לניהול הפרויקטים.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          הגישה מוגבלת לצוות Styletex Kitchens בלבד.
        </p>
      </div>
    </div>
  );
}
