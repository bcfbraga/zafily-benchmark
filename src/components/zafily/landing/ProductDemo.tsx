import { Package } from "lucide-react";
import { productDemo } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col } from "@/components/zafily/ds";

/**
 * A interface como visual herói (§13): a vitrine sangra até a borda inferior do
 * painel em vez de aparecer como screenshot pequeno no meio da seção.
 */
function VitrineBleed() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: "var(--surface-primary)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div
            className="aspect-[3/4] flex items-center justify-center"
            style={{ background: i % 3 === 0 ? "var(--surface-brand)" : "var(--surface-secondary)" }}
          >
            <Package className="w-6 h-6" style={{ color: "var(--cr-brand-300)" }} />
          </div>
          <div className="p-2.5">
            <div className="w-full h-1.5 rounded-full mb-1.5" style={{ background: "#E7E2E5" }} />
            <div className="w-1/2 h-1.5 rounded-full" style={{ background: "#F0EBEE" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDemo() {
  return (
    <Surface tone="primary" size="lg" className="!pb-0">
      <SectionGrid>
        <Col span={5}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.4vw, 46px)" }}
          >
            {productDemo.headline}
          </h2>
          <p className="mt-5 text-[15px] leading-[1.65]" style={{ color: "var(--cr-text-secondary)" }}>
            {productDemo.copy}
          </p>
        </Col>
        <Col span={7} className="mt-10 lg:mt-0">
          <div
            className="p-6 sm:p-8 pb-0 sm:pb-0"
            style={{ background: "var(--surface-secondary)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}
          >
            <VitrineBleed />
          </div>
        </Col>
      </SectionGrid>
      <div style={{ height: "var(--space-xl)" }} />
    </Surface>
  );
}
