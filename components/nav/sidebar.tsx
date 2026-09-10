"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Boxes,
  Hammer,
  CalendarDays,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const NAV_ITEMS = [
  { href: "/", label: "סקירה כללית", icon: LayoutDashboard },
  { href: "/clients", label: "לקוחות", icon: Users },
  { href: "/projects", label: "פרויקטים", icon: FolderKanban },
  { href: "/quotes", label: "מעקב מסמכים", icon: FileText },
  { href: "/calendar", label: "לוח שנה", icon: CalendarDays },
  { href: "/production", label: "ייצור", icon: Hammer },
  { href: "/materials", label: "חומרים", icon: Boxes },
];

type SidebarUser = { name?: string | null; email?: string | null };

/** Nav content shared by the fixed desktop sidebar and the mobile drawer. */
export function SidebarContent({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user?: SidebarUser;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background font-display text-sm">
          S
        </div>
        <div className="leading-tight">
          <p className="font-brand text-base text-foreground">Styletex</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Kitchens &amp; Cabinetry
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:py-2",
                active
                  ? "bg-surface-muted text-foreground"
                  : "text-muted-foreground hover:bg-surface-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted/60 hover:text-foreground sm:py-2"
        >
          <Settings className="size-4 shrink-0" />
          הגדרות
        </Link>
      </div>

      {user && (
        <div className="border-t border-border p-3">
          <div className="px-3 pb-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name ?? "משתמש"}
            </p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <SignOutButton />
        </div>
      )}
    </div>
  );
}

/** Fixed rail shown on large screens only; mobile uses MobileNav instead. */
export function Sidebar({ user }: { user?: SidebarUser }) {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-surface lg:flex">
      <SidebarContent user={user} />
    </aside>
  );
}
