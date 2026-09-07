import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileNav } from "@/components/nav/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates every dashboard route, but this check is
  // kept as defense-in-depth and to read the signed-in user's details.
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background lg:h-screen">
      <Sidebar user={session.user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
