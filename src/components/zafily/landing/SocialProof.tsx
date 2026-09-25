import { socialProof } from "@/lib/landing-copy";
import { SectionGrid, Col, TestimonialCard, MetricCard } from "@/components/zafily/ds";

/**
 * §14: bloco editorial, não carrossel de cinco cards brancos. A fala ocupa 8
 * colunas e os números da operação real entram ao lado, como mini estudo de caso.
 */
export function SocialProof() {
  return (
    <SectionGrid>
      <Col span={8}>
        <TestimonialCard
          quote={socialProof.headline}
          name="Operação real de afiliação"
          handle={socialProof.fallbackNote}
          tone="dark"
        />
      </Col>

      <Col span={4}>
        <div className="flex flex-col h-full" style={{ gap: "var(--grid-gap)" }}>
          <MetricCard value="1 link" label="no lugar de dezenas de URLs por conteúdo" tone="brand" className="flex-1" />
          <MetricCard value="1 vitrine" label="para cada Reels, live ou campanha" tone="secondary" className="flex-1" />
        </div>
      </Col>
    </SectionGrid>
  );
}
