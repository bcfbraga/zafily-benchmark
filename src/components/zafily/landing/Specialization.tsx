import { specialization } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

export function Specialization() {
  return (
    <div id="especializacao" className="scroll-mt-24">
      <Surface tone="primary" size="lg">
        <div className="mb-4">
          <SectionLabel tone="brand">{specialization.eyebrow}</SectionLabel>
        </div>

        <SectionGrid>
          <Col span={7}>
            <h2
              className="font-bold leading-[1.08] tracking-[-0.025em]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.6vw, 50px)" }}
            >
              {specialization.headline}
            </h2>
          </Col>
          <Col span={5}>
            <p className="text-[15px] leading-[1.65]" style={{ color: "var(--cr-text-secondary)" }}>
              {specialization.copy}
            </p>
          </Col>
        </SectionGrid>

        {/* Pilares em 6/6: densidade menor que o bento acima, para variar o ritmo */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2" style={{ gap: "var(--grid-gap)" }}>
          {specialization.pillars.map(p => (
            <div key={p.title} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-md)" }}>
              <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-[15px] leading-[1.6] max-w-[48ch]" style={{ color: "var(--cr-text-secondary)" }}>{p.text}</p>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
