import { useCases } from "@/lib/landing-copy";
import { SectionGrid, Col, FeatureCard, Surface } from "@/components/zafily/ds";

/**
 * Bento editorial, não seis cards iguais com ícone. Os tamanhos variam para
 * criar hierarquia: o primeiro caso é o principal e ancora a composição.
 */
const LAYOUT: Array<{ span: 3 | 4 | 6; tone: "dark" | "primary" | "brand"; size: "sm" | "md" | "lg" }> = [
  { span: 6, tone: "dark", size: "lg" },
  { span: 3, tone: "primary", size: "md" },
  { span: 3, tone: "brand", size: "md" },
  { span: 4, tone: "primary", size: "md" },
  { span: 4, tone: "primary", size: "md" },
  { span: 4, tone: "primary", size: "md" },
];

export function UseCases() {
  return (
    <Surface tone="bare" size="flush">
      <div className="mb-6">
        <h2
          className="font-bold leading-[1.08] tracking-[-0.025em]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.4vw, 46px)" }}
        >
          {useCases.headline}
        </h2>
      </div>

      <SectionGrid>
        {useCases.cards.map((card, i) => {
          const l = LAYOUT[i] ?? LAYOUT[3];
          return (
            <Col key={card.title} span={l.span}>
              <FeatureCard title={card.title} body={card.text} tone={l.tone} size={l.size} />
            </Col>
          );
        })}
      </SectionGrid>
    </Surface>
  );
}
