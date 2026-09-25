import { ArrowRight } from "lucide-react";
import { finalCta } from "@/lib/landing-copy";
import { Surface, SectionLabel, CTA } from "@/components/zafily/ds";

/**
 * Fechamento: tipografia oversized ocupando a superfície, com muito espaço
 * vazio. Alinhado à esquerda — o centro só se justificaria por composição.
 */
export function FinalCTA() {
  return (
    <Surface tone="dark" size="lg">
      <div style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-lg)" }}>
        <div className="mb-5">
          <SectionLabel tone="on-dark">{finalCta.eyebrow}</SectionLabel>
        </div>

        <h2
          className="font-bold text-white leading-[1.02] tracking-[-0.03em] max-w-[18ch]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 5.4vw, 72px)" }}
        >
          {finalCta.headline}
        </h2>

        <p className="mt-6 text-[16px] leading-[1.65] max-w-[54ch]" style={{ color: "rgba(255,255,255,0.66)" }}>
          {finalCta.copy}
        </p>

        <div className="mt-10">
          <CTA href="#acesso" variant="primary">
            {finalCta.cta} <ArrowRight className="w-4 h-4" />
          </CTA>
        </div>

        <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>{finalCta.microcopy}</p>
      </div>
    </Surface>
  );
}
