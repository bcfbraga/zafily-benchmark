"use client";

import { useRef, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { Coupon } from "@/lib/coupons-store";

/**
 * Copia texto com degradação em três níveis.
 *
 * A Clipboard API só existe em contexto seguro, e navegador embutido do
 * Instagram — que é de onde quase todo mundo chega aqui — nem sempre a
 * entrega. Por isso o `execCommand` continua no caminho: está obsoleto, mas é
 * o que funciona onde o moderno não existe.
 *
 * Devolve `false` quando os dois falham; aí a interface revela o código para
 * cópia manual, que é o único caminho que não depende do navegador cooperar.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* cai para o execCommand */ }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    // Fora da tela, mas não `display:none` nem `hidden`: o campo precisa ser
    // focável para a seleção valer.
    area.style.position = "fixed";
    area.style.top = "-9999px";
    area.setAttribute("readonly", "");
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const manualRef = useRef<HTMLInputElement>(null);

  async function handleCopy() {
    if (!coupon.code) return;
    const ok = await copyText(coupon.code);
    if (ok) {
      setCopied(true);
      setManual(false);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    // Último recurso: mostra o código já selecionado para copiar à mão.
    setManual(true);
    requestAnimationFrame(() => {
      manualRef.current?.focus();
      manualRef.current?.select();
    });
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--cr-surface)", border: "1px solid var(--cr-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-tight" style={{ color: "var(--cr-text-primary)" }}>
            {coupon.storeName}
          </p>
          {coupon.category && (
            <p className="text-xs mt-0.5" style={{ color: "var(--cr-text-tertiary)" }}>
              {coupon.category}
            </p>
          )}
        </div>
        <span
          className="shrink-0 text-sm font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: "var(--cr-surface-soft)", color: "var(--cr-text-primary)" }}
        >
          {coupon.discountLabel}
        </span>
      </div>

      {/* Alvos de 44px: a página é usada com o polegar, saindo do Instagram. */}
      <div className="flex gap-2 mt-3.5">
        {coupon.code && (
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className="flex-1 min-h-[44px] px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity active:opacity-70"
            style={{
              background: "var(--cr-surface-soft)",
              color: "var(--cr-text-primary)",
              border: "1px solid var(--cr-border)",
            }}
          >
            {copied
              ? <><Check className="w-4 h-4" /> Copiado!</>
              : <><Copy className="w-4 h-4" /> {coupon.code}</>}
          </button>
        )}
        <a
          href={coupon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity active:opacity-70"
          style={{ background: "var(--cr-brand-600)", color: "var(--cr-on-brand, #fff)" }}
        >
          Ver loja <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {manual && coupon.code && (
        <div className="mt-2.5">
          <label className="text-xs block mb-1" style={{ color: "var(--cr-text-tertiary)" }}>
            Não deu para copiar sozinho — toque e segure para copiar:
          </label>
          <input
            ref={manualRef}
            readOnly
            value={coupon.code}
            onFocus={e => e.currentTarget.select()}
            className="w-full min-h-[44px] px-3 rounded-xl text-sm font-mono text-center"
            style={{
              background: "var(--cr-surface-soft)",
              color: "var(--cr-text-primary)",
              border: "1px solid var(--cr-border)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function PublicCoupons({ coupons }: { coupons: Coupon[] }) {
  // Seção sem conteúdo simplesmente não existe — o brief pede que ela possa
  // ficar vazia, e um título sozinho seria pior que a ausência.
  if (coupons.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--cr-text-secondary)" }}>
        Cupons ativos
      </h2>
      <div className="space-y-2.5">
        {coupons.map(coupon => <CouponCard key={coupon.id} coupon={coupon} />)}
      </div>
    </section>
  );
}
