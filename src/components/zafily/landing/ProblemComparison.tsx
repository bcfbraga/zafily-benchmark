import { Link2, Check } from "lucide-react";
import { problem } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

/**
 * Antes / depois. A assimetria conta a história: o card "antes" é denso e
 * repetitivo, o "depois" é limpo — a composição comunica antes do texto.
 */
export function ProblemComparison() {
  return (
    <Surface tone="primary" size="lg">
      <div className="mb-4">
        <SectionLabel>{problem.eyebrow}</SectionLabel>
      </div>

      <SectionGrid>
        <Col span={7}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.6vw, 50px)" }}
          >
            {problem.headline}
          </h2>
        </Col>
        <Col span={5}>
          <p className="text-[15px] leading-[1.65]" style={{ color: "var(--cr-text-secondary)" }}>
            {problem.copy}
          </p>
        </Col>
      </SectionGrid>

      <SectionGrid className="mt-12">
        {/* Antes — denso, cansativo de ler: é esse o ponto */}
        <Col span={6}>
          <Surface tone="secondary" size="md" radius="lg" className="!h-full">
            <p className="text-sm font-semibold mb-5">{problem.before.title}</p>
            <div className="flex flex-col gap-2">
              {problem.before.items.map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                  style={{ background: "var(--surface-primary)", borderRadius: "var(--radius-sm)" }}
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--cr-text-tertiary)" }} />
                  <span className="text-xs shrink-0" style={{ color: "var(--cr-text-secondary)" }}>{item.label}</span>
                  <span className="text-[11px] truncate" style={{ fontFamily: "var(--font-data)", color: "var(--cr-text-tertiary)" }}>
                    {item.url}
                  </span>
                </div>
              ))}
              <p className="text-xs px-3 pt-1" style={{ color: "var(--cr-text-tertiary)" }}>{problem.before.moreLabel}…</p>
            </div>
            <p className="text-xs mt-5" style={{ color: "var(--cr-text-tertiary)" }}>{problem.before.caption}</p>
          </Surface>
        </Col>

        {/* Depois — uma linha só */}
        <Col span={6}>
          <Surface tone="brand" size="md" radius="lg" className="!h-full">
            <p className="text-sm font-semibold mb-5">{problem.after.title}</p>
            <div className="px-4 py-4" style={{ background: "var(--surface-primary)", borderRadius: "var(--radius-md)" }}>
              <p className="text-sm mb-3">{problem.after.message}</p>
              <div
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium max-w-full"
                style={{ background: "var(--cr-brand-50)", color: "var(--cr-brand-700)", borderRadius: "var(--radius-sm)" }}
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" style={{ fontFamily: "var(--font-data)" }}>{problem.after.url}</span>
              </div>
            </div>
            <p className="text-xs mt-5" style={{ color: "var(--cr-text-secondary)" }}>{problem.after.caption}</p>
          </Surface>
        </Col>
      </SectionGrid>

      <p className="text-xs mt-8" style={{ color: "var(--cr-text-tertiary)" }}>{problem.metaNote}</p>
    </Surface>
  );
}
