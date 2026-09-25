import { ArrowRight, Package } from "lucide-react";
import { hero } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel, CTA } from "@/components/zafily/ds";

/**
 * Vitrine em miniatura — a interface entra como elemento da composição, não
 * como screenshot solto embaixo do texto.
 */
function VitrinePreview() {
  return (
    <div
      className="w-full h-full min-h-[320px] flex flex-col"
      style={{ background: "#FFFFFF", borderRadius: "var(--radius-lg)", overflow: "hidden" }}
    >
      {/* Cabeçalho do perfil */}
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-12 h-12 rounded-full mb-2" style={{ background: "var(--surface-brand)" }} />
        <div className="w-24 h-2.5 rounded-full mb-1.5" style={{ background: "#E7E2E5" }} />
        <div className="w-16 h-2 rounded-full" style={{ background: "#F0EBEE" }} />
      </div>

      {/* Produtos */}
      <div className="p-4 grid grid-cols-2 gap-3 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: "var(--surface-secondary)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <div className="aspect-square flex items-center justify-center" style={{ background: i % 2 === 0 ? "var(--surface-brand)" : "#F0EBEE" }}>
              <Package className="w-5 h-5" style={{ color: "var(--cr-brand-300)" }} />
            </div>
            <div className="p-2.5">
              <div className="w-full h-1.5 rounded-full mb-1.5" style={{ background: "#E7E2E5" }} />
              <div className="w-2/3 h-1.5 rounded-full" style={{ background: "#F0EBEE" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <Surface tone="dark" size="lg" className="pt-28 sm:pt-32">
      <SectionGrid className="items-center">
        {/* 7 / 5 — assimetria intencional, o texto pesa mais que o visual */}
        <Col span={7}>
          <div className="mb-6">
            <SectionLabel tone="on-dark">{hero.eyebrow}</SectionLabel>
          </div>

          <h1
            className="font-bold text-white leading-[1.02] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(40px, 5.6vw, 76px)" }}
          >
            {hero.headline[0]}
            <br />
            <span style={{ color: "var(--cr-brand-500)" }}>{hero.headline[1]}</span>
          </h1>

          <p className="mt-6 text-[17px] leading-[1.6] max-w-[52ch]" style={{ color: "rgba(255,255,255,0.66)" }}>
            {hero.subheadline}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
            <CTA href="#acesso" variant="primary">
              {hero.ctaPrimary} <ArrowRight className="w-4 h-4" />
            </CTA>
            <CTA href="#como-funciona" variant="ghost" className="!text-white/70 !border-white/15">
              {hero.ctaSecondary}
            </CTA>
          </div>

          <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>{hero.microcopy}</p>
        </Col>

        <Col span={5} className="mt-10 lg:mt-0">
          <VitrinePreview />
          {/* O link é o produto: fica logo abaixo da vitrine, como legenda */}
          <p
            className="mt-4 text-[13px] text-center truncate"
            style={{ fontFamily: "var(--font-data)", color: "rgba(255,255,255,0.5)" }}
          >
            {hero.demoUrl}
          </p>
        </Col>
      </SectionGrid>
    </Surface>
  );
}
