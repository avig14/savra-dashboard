"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, BookOpen, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/dashboard/teachers",   label: "Teachers",   icon: Users },
  { href: "/dashboard/classrooms", label: "Classrooms", icon: BookOpen },
  { href: "/dashboard/reports",    label: "Reports",    icon: BarChart3 },
];

interface SidebarProps {
  user?: { name?: string | null; email?: string | null };
}

export function Sidebar({ user }: SidebarProps = {}) {
  const pathname = usePathname();

  // Dynamic name + initials — fall back to PRD default if no session user
  const displayName = user?.name ?? "Shauryaman Ray";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r bg-sidebar border-sidebar-border">

      {/* ── SAVRA Logo ─────────────────────────────────────────── */}
      <div className="flex justify-center items-center px-6 pt-5 pb-3">
        <Image
          src="/savra-logo.jpg"
          alt="Savra"
          width={148}
          height={148}
          className="object-contain mix-blend-multiply dark:mix-blend-normal dark:brightness-0 dark:invert"
          priority
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-2 pb-5">
        <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40 select-none">
          Main
        </p>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium",
                  "transition-colors duration-150",
                  active
                    ? "bg-white/60 text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── School Admin Footer ─────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-1">
          {/* Avatar with online status dot */}
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-400 text-white text-xs font-bold shadow-sm select-none">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
          </div>
          {/* Role + Name */}
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/50 leading-none mb-0.5">
              School Admin
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {displayName}
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
}
