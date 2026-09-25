"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ZafilyLogo } from "@/components/zafily/Logo";
import { nav } from "@/lib/landing-copy";
import { CTA } from "@/components/zafily/ds";

/**
 * Header flutuante: uma pílula sobre o canvas, não uma barra colada no topo.
 * Segue a mesma lógica dos demais módulos — superfície arredondada com o fundo
 * aparecendo em volta.
 */
export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed top-3 sm:top-5 inset-x-0 z-50 px-4 sm:px-6">
      <header
        className="mx-auto flex items-center justify-between h-14 pl-5 pr-3"
        style={{
          maxWidth: "var(--content-max-width)",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-full)",
        }}
      >
        <Link href="/" className="shrink-0" aria-label="Zafily">
          <ZafilyLogo size={26} />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm" aria-label="Navegação principal" style={{ color: "var(--cr-text-secondary)" }}>
          {nav.links.map(item => (
            <a key={item.href} href={item.href} className="transition-colors hover:opacity-70">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center h-10 px-4 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--cr-text-secondary)" }}
          >
            {nav.login}
          </Link>
          <CTA href="#acesso" variant="dark" className="!h-10 !px-5 text-[13px]">
            {nav.cta}
          </CTA>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden w-10 h-10 flex items-center justify-center"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            style={{ color: "var(--cr-text-primary)" }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="md:hidden mx-auto mt-2 p-3 flex flex-col"
          style={{
            maxWidth: "var(--content-max-width)",
            background: "var(--surface-primary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {nav.links.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium"
              style={{ color: "var(--cr-text-secondary)" }}
            >
              {item.label}
            </a>
          ))}
          <Link href="/login" className="px-4 py-3 text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>
            {nav.login}
          </Link>
        </div>
      )}
    </div>
  );
}
