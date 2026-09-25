"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

const TABS = [...navItems, { label: "Ajustes", href: "/app/settings", icon: Settings }];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden shrink-0 border-t border-black/[0.08] bg-white flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium transition-colors",
              active ? "text-[var(--cr-brand-500)]" : "text-[var(--cr-text-tertiary)]"
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
