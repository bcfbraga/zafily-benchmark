"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Design tab is temporarily disabled — re-add { href: "/app/vitrine/design", label: "Design" } to reactivate.
const TABS = [
  { href: "/app/vitrine", label: "Links" },
];

export function VitrineTabs() {
  const pathname = usePathname();

  if (TABS.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 px-8 pt-4 bg-white" style={{ borderBottom: "1px solid var(--cr-border)" }}>
      {TABS.map(tab => {
        const active = tab.href === "/app/vitrine" ? pathname === "/app/vitrine" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: active ? "var(--cr-brand-600)" : "transparent",
              color: active ? "var(--cr-text-primary)" : "var(--cr-text-tertiary)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
