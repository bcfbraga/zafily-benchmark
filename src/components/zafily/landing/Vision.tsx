import { vision } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

export function Vision() {
  return (
    <Surface tone="primary" size="lg">
      <div className="mb-4">
        <SectionLabel>{vision.eyebrow}</SectionLabel>
      </div>

      <SectionGrid>
        <Col span={6}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.4vw, 46px)" }}
          >
            {vision.headline}
          </h2>
        </Col>
        <Col span={6}>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--cr-text-secondary)" }}>{vision.copy}</p>
        </Col>
      </SectionGrid>

      <div
        className="mt-12 px-6 py-6 sm:px-8 sm:py-7"
        style={{ background: "var(--surface-brand)", borderRadius: "var(--radius-lg)" }}
      >
        <p
          className="font-bold leading-[1.2] tracking-[-0.02em] max-w-[60ch]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(18px, 2vw, 26px)" }}
        >
          {vision.highlight}
        </p>
      </div>
    </Surface>
  );
}
