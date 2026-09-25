import Link from "next/link";
import { ZafilyLogo } from "@/components/zafily/Logo";
import { footer } from "@/lib/landing-copy";
import { CanvasSection } from "@/components/zafily/ds";

/**
 * O rodapé fica direto sobre o canvas, sem superfície — é o que encerra a
 * página e devolve o olho ao fundo.
 */
export function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <CanvasSection>
        <div className="py-14 grid grid-cols-1 lg:grid-cols-12" style={{ gap: "var(--grid-gap)" }}>
          <div className="lg:col-span-5">
            <ZafilyLogo size={26} />
            <p className="mt-5 text-sm leading-[1.65] max-w-[46ch]" style={{ color: "var(--cr-text-secondary)" }}>
              {footer.description}
            </p>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 flex flex-col sm:flex-row gap-10">
            <nav className="flex flex-col gap-3">
              {footer.links.map(l => (
                <Link key={l.label} href={l.href} className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--cr-text-secondary)" }}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-col gap-3">
              {footer.legal.map(l => (
                <Link key={l.label} href={l.href} className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--cr-text-tertiary)" }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="pb-10 pt-2">
          <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
            © {new Date().getFullYear()} Zafily
          </p>
        </div>
      </CanvasSection>
    </footer>
  );
}
