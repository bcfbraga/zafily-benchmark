"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ZafilyLogo } from "./Logo";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { navItems } from "@/lib/nav-items";
import { Settings, Plug, LogOut, X } from "lucide-react";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Close on route change so the drawer doesn't stay open after navigating.
  useEffect(() => {
    onClose();
    // Only re-run when the route changes — onClose is stable enough in practice
    // and including it would close the drawer on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
  }

  const email = user?.email ?? "";
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? email;
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")}>
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white flex flex-col shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-[72px] flex items-center justify-between border-b border-black/[0.06] shrink-0 px-4">
          <Link href="/" className="px-1" onClick={onClose}>
            <ZafilyLogo size={28} />
          </Link>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 h-11 px-3 rounded-[4px] text-sm font-medium transition-colors",
                  active ? "bg-[rgba(247, 89, 173,0.12)] text-[var(--cr-brand-700)]" : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-[var(--cr-brand-500)]" : "")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-4 border-t border-black/[0.06] pt-3 space-y-0.5">
          <Link
            href="/app/integrations"
            className={cn(
              "flex items-center gap-3 h-11 px-3 rounded-[4px] text-sm font-medium transition-colors",
              pathname === "/app/integrations" ? "bg-[rgba(247, 89, 173,0.12)] text-[var(--cr-brand-700)]" : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
            )}
          >
            <Plug className={cn("w-4 h-4 shrink-0", pathname === "/app/integrations" ? "text-[var(--cr-brand-500)]" : "")} />
            Integrações
          </Link>
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 h-11 px-3 rounded-[4px] text-sm font-medium transition-colors",
              pathname === "/app/settings" ? "bg-[rgba(247, 89, 173,0.12)] text-[var(--cr-brand-700)]" : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
            )}
          >
            <Settings className={cn("w-4 h-4 shrink-0", pathname === "/app/settings" ? "text-[var(--cr-brand-500)]" : "")} />
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 h-11 px-3 rounded-[4px] text-sm font-medium text-[var(--cr-text-tertiary)] hover:text-[#E11D48] hover:bg-[rgba(225,29,72,0.06)] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
          <div className="mt-1 flex items-center gap-3 px-3 py-2.5 rounded-[4px] bg-black/[0.03]">
            <div className="w-7 h-7 rounded-full bg-[var(--cr-brand-500)] flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--cr-text-primary)] truncate">{displayName || "..."}</p>
              <p className="text-[10px] text-[var(--cr-text-tertiary)] truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
