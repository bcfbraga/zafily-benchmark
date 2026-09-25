import Link from "next/link";
import { cn } from "@/lib/utils";
import { Surface, type SurfaceTone } from "./Surface";
import { SectionLabel } from "./layout";

/**
 * Variantes de card do sistema. Todas nascem de Surface, então raio, borda e
 * respiro vêm de um lugar só — a consistência é do sistema, não de repetição.
 */

// ── CTA ──────────────────────────────────────────────────────────────────────

type CTAVariant = "primary" | "dark" | "light" | "ghost";

const CTA_STYLE: Record<CTAVariant, React.CSSProperties> = {
  // Rosa é reservado para a ação principal — é assim que ele continua sendo lido
  // como marca em vez de virar cor de fundo.
  primary: { background: "var(--cr-brand-500)", color: "#FFFFFF" },
  dark: { background: "var(--surface-dark)", color: "#FFFFFF" },
  light: { background: "#FFFFFF", color: "var(--surface-dark)" },
  ghost: { background: "transparent", color: "var(--cr-text-secondary)", border: "1px solid var(--border-subtle)" },
};

export function CTA({
  href, children, variant = "primary", className,
}: { href: string; children: React.ReactNode; variant?: CTAVariant; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-12 px-6 text-sm font-semibold transition-opacity hover:opacity-90",
        className
      )}
      style={{ ...CTA_STYLE[variant], borderRadius: "var(--radius-full)" }}
    >
      {children}
    </Link>
  );
}

// ── Feature ──────────────────────────────────────────────────────────────────

/**
 * Uma mensagem por card. O briefing é explícito: não espremer várias ideias na
 * mesma superfície.
 */
export function FeatureCard({
  label, title, body, tone = "primary", size = "md", className, children,
}: {
  label?: string;
  title: string;
  body?: string;
  tone?: SurfaceTone;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}) {
  const onDark = tone === "dark";
  return (
    <Surface tone={tone} size={size} className={className}>
      <div className="flex flex-col h-full">
        {label && (
          <div style={{ marginBottom: "var(--space-sm)" }}>
            <SectionLabel tone={onDark ? "on-dark" : "muted"}>{label}</SectionLabel>
          </div>
        )}
        <h3
          className="font-bold leading-[1.08] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px, 2.4vw, 36px)" }}
        >
          {title}
        </h3>
        {body && (
          <p
            className="mt-3 text-[15px] leading-[1.6] max-w-[46ch]"
            style={{ color: onDark ? "rgba(255,255,255,0.68)" : "var(--cr-text-secondary)" }}
          >
            {body}
          </p>
        )}
        {children && <div className="mt-auto pt-6">{children}</div>}
      </div>
    </Surface>
  );
}

// ── Metric ───────────────────────────────────────────────────────────────────

/** Número dominando a composição, em mono tabular como pede o token de dados. */
export function MetricCard({
  value, label, tone = "secondary", className,
}: { value: string; label: string; tone?: SurfaceTone; className?: string }) {
  const onDark = tone === "dark";
  return (
    <Surface tone={tone} size="md" className={className}>
      <div className="flex flex-col justify-center h-full">
        <p
          className="font-bold leading-none tracking-[-0.03em]"
          style={{
            fontFamily: "var(--font-data)",
            fontVariantNumeric: "tabular-nums",
            fontSize: "clamp(36px, 4.4vw, 64px)",
            color: onDark ? "#FFFFFF" : "var(--cr-text-primary)",
          }}
        >
          {value}
        </p>
        <p
          className="mt-3 text-sm leading-snug max-w-[24ch]"
          style={{ color: onDark ? "rgba(255,255,255,0.62)" : "var(--cr-text-secondary)" }}
        >
          {label}
        </p>
      </div>
    </Surface>
  );
}

// ── Visual ───────────────────────────────────────────────────────────────────

/**
 * Card majoritariamente imagem. A imagem sangra até a borda arredondada — nunca
 * um screenshot pequeno boiando no meio de uma seção enorme.
 */
export function VisualCard({
  title, caption, aspect = "4/3", className, children, overlay,
}: {
  title?: string;
  caption?: string;
  aspect?: string;
  className?: string;
  children: React.ReactNode;
  overlay?: boolean;
}) {
  return (
    <Surface tone="bare" size="flush" className={cn("relative", className)}>
      <div className="relative w-full h-full" style={{ aspectRatio: children ? aspect : undefined }}>
        {children}
        {overlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(12,12,12,0.72) 0%, rgba(12,12,12,0.08) 46%, transparent 72%)" }}
          />
        )}
        {(title || caption) && (
          <div className="absolute left-0 bottom-0 p-6 sm:p-8">
            {caption && (
              <p className="text-[11px] font-semibold uppercase mb-2" style={{ fontFamily: "var(--font-data)", letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)" }}>
                {caption}
              </p>
            )}
            {title && (
              <p className="text-white font-bold leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 2vw, 30px)" }}>
                {title}
              </p>
            )}
          </div>
        )}
      </div>
    </Surface>
  );
}

// ── Testimonial ──────────────────────────────────────────────────────────────

/** Mini estudo de caso, não card de depoimento genérico: fala + número + quem. */
export function TestimonialCard({
  quote, name, handle, metric, metricLabel, tone = "dark", className, children,
}: {
  quote: string;
  name: string;
  handle?: string;
  metric?: string;
  metricLabel?: string;
  tone?: SurfaceTone;
  className?: string;
  children?: React.ReactNode;
}) {
  const onDark = tone === "dark";
  const muted = onDark ? "rgba(255,255,255,0.62)" : "var(--cr-text-secondary)";
  return (
    <Surface tone={tone} size="lg" className={className}>
      <div className="flex flex-col h-full">
        <blockquote
          className="font-bold leading-[1.16] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 2.6vw, 38px)" }}
        >
          {quote}
        </blockquote>

        {metric && (
          <div className="mt-8">
            <p
              className="font-bold leading-none"
              style={{ fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums", fontSize: "clamp(28px, 3vw, 44px)", color: "var(--cr-brand-500)" }}
            >
              {metric}
            </p>
            {metricLabel && <p className="mt-2 text-sm" style={{ color: muted }}>{metricLabel}</p>}
          </div>
        )}

        <div className="mt-auto pt-8 flex items-center gap-3">
          {children}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            {handle && <p className="text-xs truncate" style={{ color: muted }}>{handle}</p>}
          </div>
        </div>
      </div>
    </Surface>
  );
}
