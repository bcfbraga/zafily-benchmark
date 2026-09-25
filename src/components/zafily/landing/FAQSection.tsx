import { ChevronDown } from "lucide-react";
import { faq } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col } from "@/components/zafily/ds";

/**
 * 4/8: o título fica numa coluna estreita à esquerda e as perguntas ocupam o
 * resto — alinhado à esquerda, sem o bloco centralizado de antes.
 */
export function FAQSection() {
  return (
    <Surface tone="primary" size="lg">
      <SectionGrid>
        <Col span={4}>
          <h2
            className="font-bold leading-[1.08] tracking-[-0.025em] lg:sticky lg:top-28"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.4vw, 46px)" }}
          >
            {faq.headline}
          </h2>
        </Col>

        <Col span={8}>
          <div className="flex flex-col gap-2">
            {faq.items.map(item => (
              <details
                key={item.q}
                className="group px-5 open:pb-5"
                style={{ background: "var(--surface-secondary)", borderRadius: "var(--radius-lg)" }}
              >
                <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-left font-medium [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180"
                    style={{ color: "var(--cr-brand-600)" }}
                  />
                </summary>
                <p className="text-[15px] leading-[1.65] max-w-[64ch]" style={{ color: "var(--cr-text-secondary)" }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Col>
      </SectionGrid>
    </Surface>
  );
}
