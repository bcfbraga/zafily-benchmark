"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/${username}`, label: "Links" },
    { href: `/${username}/vitrines`, label: "Vitrines" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 mb-8 border-b" style={{ borderColor: "var(--cr-border)" }}>
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px"
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
