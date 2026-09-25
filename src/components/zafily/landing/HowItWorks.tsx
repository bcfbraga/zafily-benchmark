import { howItWorks } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

export function HowItWorks() {
  return (
    <div id="como-funciona" className="scroll-mt-24">
      <Surface tone="dark" size="lg">
        <div className="mb-4">
          <SectionLabel tone="on-dark">{howItWorks.eyebrow}</SectionLabel>
        </div>

        <SectionGrid>
          <Col span={8}>
            <h2
              className="font-bold text-white leading-[1.08] tracking-[-0.025em]"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.6vw, 50px)" }}
            >
              {howItWorks.headline}
            </h2>
          </Col>
        </SectionGrid>

        {/* Três passos: o número é o elemento gráfico, não um ícone decorativo */}
        <SectionGrid className="mt-14">
          {howItWorks.steps.map((step, i) => (
            <Col key={step.title} span={4}>
              <div className="h-full flex flex-col" style={{ borderTop: "1px solid var(--border-on-dark)", paddingTop: "var(--space-md)" }}>
                <span
                  className="font-bold leading-none mb-6"
                  style={{ fontFamily: "var(--font-data)", fontSize: "40px", color: "var(--cr-brand-500)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-[15px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.62)" }}>{step.text}</p>
              </div>
            </Col>
          ))}
        </SectionGrid>

        <p className="text-sm mt-12 max-w-[60ch]" style={{ color: "rgba(255,255,255,0.5)" }}>{howItWorks.note}</p>
      </Surface>
    </div>
  );
}
