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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "סקירה כללית", icon: LayoutDashboard },
  { href: "/clients", label: "לקוחות", icon: Users },
  { href: "/projects", label: "פרויקטים", icon: FolderKanban },
  { href: "/calendar", label: "לוח שנה", icon: CalendarDays },
  { href: "/production", label: "ייצור", icon: Hammer },
  { href: "/materials", label: "חומרים", icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-e border-border bg-surface">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background font-display text-sm">
          S
        </div>
        <div className="leading-tight">
          <p className="font-brand text-base text-foreground">Styletex</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Kitchens &amp; Cabinetry
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-surface-muted text-foreground"
                  : "text-muted-foreground hover:bg-surface-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted/60 hover:text-foreground"
        >
          <Settings className="size-4" />
          הגדרות
        </Link>
      </div>
    </aside>
  );
}
