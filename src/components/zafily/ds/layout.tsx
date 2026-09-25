import { cn } from "@/lib/utils";

/**
 * Primitivos de layout do design system.
 *
 * A página é um canvas contínuo com módulos arredondados flutuando por cima —
 * não uma pilha de seções independentes. O canvas precisa ficar visível entre
 * os módulos: é ele que costura tudo como um ambiente só.
 */

// ── Canvas ───────────────────────────────────────────────────────────────────

export function PageCanvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("min-h-screen", className)}
      style={{ background: "var(--page-background)", color: "var(--cr-text-primary)", fontFamily: "var(--font-body)" }}
    >
      {children}
    </div>
  );
}

/**
 * Faixa horizontal que segura os módulos. O respiro vertical entre faixas é
 * onde o canvas aparece, então nunca deve ser removido.
 */
export function CanvasSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6", className)}
      style={{ maxWidth: "var(--content-max-width)" }}
    >
      {children}
    </div>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────────

/**
 * Grid de 12 colunas. No mobile vira uma coluna só — o briefing pede narrativa
 * vertical deliberada, não o grid do desktop espremido.
 */
export function SectionGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-1 lg:grid-cols-12", className)}
      style={{ gap: "var(--grid-gap)" }}
    >
      {children}
    </div>
  );
}

const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
};

export function Col({ span, children, className }: { span: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12; children: React.ReactNode; className?: string }) {
  return <div className={cn(SPAN[span], "min-w-0", className)}>{children}</div>;
}

// ── Rótulo de seção ──────────────────────────────────────────────────────────

/**
 * Eyebrow em monoespaçada — o token de tipografia reserva a mono para dados e
 * labels, e ela dá o contraste de escala que separa metadado de manchete.
 */
export function SectionLabel({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "brand" | "on-dark" }) {
  const color =
    tone === "brand" ? "var(--cr-brand-600)"
    : tone === "on-dark" ? "rgba(255,255,255,0.56)"
    : "var(--cr-text-tertiary)";
  return (
    <p
      className="text-[11px] font-semibold uppercase"
      style={{ fontFamily: "var(--font-data)", letterSpacing: "0.06em", color }}
    >
      {children}
    </p>
  );
}
