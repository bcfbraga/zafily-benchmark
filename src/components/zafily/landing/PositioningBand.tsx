import { positioningBand } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col } from "@/components/zafily/ds";

/**
 * Faixa de posicionamento: tipografia como elemento gráfico principal, 8/4 —
 * a manchete domina e o complemento entra como metadado.
 */
export function PositioningBand() {
  return (
    <Surface tone="brand" size="lg">
      <SectionGrid className="items-end">
        <Col span={8}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(26px, 3.4vw, 46px)" }}
          >
            {positioningBand.headline}
          </h2>
        </Col>
        <Col span={4}>
          <p className="text-[15px] leading-[1.6] lg:text-right" style={{ color: "var(--cr-text-secondary)" }}>
            {positioningBand.complement}
          </p>
        </Col>
      </SectionGrid>
    </Surface>
  );
}
