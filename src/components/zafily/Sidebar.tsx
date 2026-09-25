"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ZafilyLogo } from "./Logo";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { navItems } from "@/lib/nav-items";
import {
  Settings,
  Plug,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Users,
} from "lucide-react";

const COLLAPSED_KEY = "zafily_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isProposalEditor = /^\/app\/orcamentos\/[^/]+$/.test(pathname) && !pathname.endsWith("/novo");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(profile => setIsAdmin(!!profile?.isAdmin));
  }, []);

  useEffect(() => {
    if (isProposalEditor) {
      setCollapsed(true);
      return;
    }
    const saved = localStorage.getItem(COLLAPSED_KEY);
    setCollapsed(saved === "1");
  }, [isProposalEditor]);

  function toggle() {
    setCollapsed(c => {
      localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const email = user?.email ?? "";
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? email;
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <aside
      className={cn(
        // Superfície própria sobre o canvas, não uma coluna colada na borda.
        // Sem borda: a separação vem do tom, como na referência.
        "hidden lg:flex shrink-0 h-full flex-col transition-[width] duration-200 overflow-hidden rounded-[var(--radius-xl)]",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
      style={{ background: "var(--surface-primary)" }}
    >
      {/* Logo + collapse button */}
      <div className="h-[72px] flex items-center border-b border-black/[0.06] shrink-0 px-3 gap-2">
        {!collapsed && (
          <Link href="/" className="flex-1 px-3">
            <ZafilyLogo size={28} />
          </Link>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.05] transition-colors shrink-0",
            collapsed && "mx-auto"
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hidden">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-150",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-[var(--cr-surface-soft)] text-[var(--cr-text-primary)] font-semibold"
                  : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-[var(--cr-text-tertiary)]" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 border-t border-black/[0.06] pt-3 space-y-0.5">
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9B96AF]">
                Gestão
              </p>
            )}
            <Link
              href="/app/admin/access-requests"
              title={collapsed ? "Pedidos de acesso" : undefined}
              className={cn(
                "flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                pathname === "/app/admin/access-requests"
                  ? "bg-[var(--cr-surface-soft)] text-[var(--cr-text-primary)] font-semibold"
                  : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {!collapsed && "Pedidos de acesso"}
            </Link>
            <Link
              href="/app/admin/users"
              title={collapsed ? "Usuários" : undefined}
              className={cn(
                "flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                pathname === "/app/admin/users"
                  ? "bg-[var(--cr-surface-soft)] text-[var(--cr-text-primary)] font-semibold"
                  : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
              )}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!collapsed && "Usuários"}
            </Link>
          </>
        )}

        <Link
          href="/app/integrations"
          title={collapsed ? "Integrações" : undefined}
          className={cn(
            "flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            pathname === "/app/integrations"
              ? "bg-[var(--cr-surface-soft)] text-[var(--cr-text-primary)] font-semibold"
              : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
          )}
        >
          <Plug className="w-4 h-4 shrink-0" />
          {!collapsed && "Integrações"}
        </Link>

        <Link
          href="/app/settings"
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            pathname === "/app/settings"
              ? "bg-[var(--cr-surface-soft)] text-[var(--cr-text-primary)] font-semibold"
              : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:bg-black/[0.04]"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && "Configurações"}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "w-full flex items-center gap-3 h-10 rounded-[var(--radius-md)] text-sm font-medium text-[var(--cr-text-tertiary)] hover:text-[#E11D48] hover:bg-[rgba(225,29,72,0.06)] transition-colors",
            collapsed ? "justify-center px-0" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sair"}
        </button>

        {!collapsed && (
          <div className="mt-1 flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-black/[0.03]">
            <div className="w-7 h-7 rounded-full bg-[var(--cr-surface-soft)] flex items-center justify-center text-xs font-semibold text-[var(--cr-text-primary)] shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--cr-text-primary)] truncate">{displayName || "..."}</p>
              <p className="text-[10px] text-[var(--cr-text-tertiary)] truncate">{email}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mt-1">
            <div className="w-7 h-7 rounded-full bg-[var(--cr-surface-soft)] flex items-center justify-center text-xs font-semibold text-[var(--cr-text-primary)]">
              {initial}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
