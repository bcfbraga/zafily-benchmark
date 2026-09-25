import { Check, Minus } from "lucide-react";
import { audienceFit } from "@/lib/landing-copy";
import { Surface, SectionGrid, Col, SectionLabel } from "@/components/zafily/ds";

export function AudienceFit() {
  return (
    <div id="para-quem" className="scroll-mt-24">
      <Surface tone="primary" size="lg">
        <h2
          className="font-bold leading-[1.08] tracking-[-0.025em] max-w-[20ch]"
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 3.6vw, 50px)" }}
        >
          {audienceFit.headline}
        </h2>

        <SectionGrid className="mt-12">
          <Col span={6}>
            <Surface tone="brand" size="md" radius="lg" className="!h-full">
              <div className="mb-5">
                <SectionLabel tone="brand">{audienceFit.fitLabel}</SectionLabel>
              </div>
              <ul className="flex flex-col gap-3">
                {audienceFit.fit.map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cr-brand-600)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Surface>
          </Col>

          <Col span={6}>
            <Surface tone="secondary" size="md" radius="lg" className="!h-full">
              <div className="mb-5">
                <SectionLabel>{audienceFit.notFitLabel}</SectionLabel>
              </div>
              <ul className="flex flex-col gap-3">
                {audienceFit.notFit.map(item => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] leading-[1.5]"
                    style={{ color: "var(--cr-text-secondary)" }}
                  >
                    <Minus className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cr-text-tertiary)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Surface>
          </Col>
        </SectionGrid>

        <p className="text-sm mt-10 max-w-[72ch]" style={{ color: "var(--cr-text-tertiary)" }}>{audienceFit.note}</p>
      </Surface>
    </div>
  );
}
