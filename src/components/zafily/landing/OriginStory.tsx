import { originStory } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

/**
 * Narrativa: 5/7 com o texto em coluna estreita. Duas frases curtas do meio
 * ganham escala e viram o ponto de virada da história.
 */
export function OriginStory() {
  const [opening, pivotA, pivotB, ...rest] = originStory.paragraphs;

  return (
    <Surface tone="brand" size="lg">
      <div className="mb-4">
        <SectionLabel>{originStory.eyebrow}</SectionLabel>
      </div>

      <SectionGrid>
        <Col span={5}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.2vw, 44px)" }}
          >
            {originStory.headline}
          </h2>
        </Col>

        <Col span={7}>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--cr-text-secondary)" }}>{opening}</p>

          <p
            className="my-8 font-bold leading-[1.16] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 2.2vw, 30px)" }}
          >
            {pivotA}
            <br />
            <span style={{ color: "var(--cr-brand-600)" }}>{pivotB}</span>
          </p>

          <div className="flex flex-col gap-4">
            {rest.map(p => (
              <p key={p} className="text-[15px] leading-[1.7]" style={{ color: "var(--cr-text-secondary)" }}>{p}</p>
            ))}
          </div>
        </Col>
      </SectionGrid>
    </Surface>
  );
}
