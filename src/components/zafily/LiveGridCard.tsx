import Image from "next/image";
import { Package } from "lucide-react";
import type { Live } from "@/lib/lives-store";

/**
 * Card de live na galeria pública: capa grande com a contagem de produtos e,
 * abaixo, uma amostra do que tem dentro.
 *
 * A capa sozinha não dizia se valia abrir; as três miniaturas dão a prévia e o
 * badge dá a dimensão da vitrine antes do clique.
 */
export function LiveGridCard({ live, username }: { live: Live; username: string }) {
  const thumbs = (live.previewProducts ?? []).filter(p => p.imageUrl).slice(0, 4);
  const total = live.productCount ?? 0;
  const remaining = total - thumbs.length;

  return (
    <a href={`/${username}/${live.slug}`} className="group block">
      {/* Capa */}
      <div
        // As capas são banners largos (~2.4:1). Forçar 4:3 cortava metade da arte.
        className="relative w-full aspect-[12/5] overflow-hidden rounded-[var(--radius-lg)]"
        style={{ background: "var(--cr-surface-soft)" }}
      >
        {live.imageUrl ? (
          <Image
            src={live.imageUrl}
            alt={live.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8" style={{ color: "var(--cr-text-tertiary)" }} />
          </div>
        )}

      </div>

      {/* Amostra do conteúdo: 5 slots — 4 produtos e o restante como "+N".
          A contagem fica junto dos produtos a que se refere, em vez de flutuar
          sobre a capa. */}
      {thumbs.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 mt-1.5">
          {thumbs.map(p => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)]"
              style={{ background: "var(--cr-surface-soft)" }}
            >
              {/* Produto vem do CDN da loja, fora do remotePatterns — precisa
                  seguir em <img>. Não custa egress do Supabase de qualquer forma. */}
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}

          {remaining > 0 && (
            <div
              className="aspect-square rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-semibold"
              style={{ background: "var(--surface-dark)", color: "#FFFFFF" }}
            >
              +{remaining}
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-sm font-semibold truncate" style={{ color: "var(--cr-text-primary)" }}>
        {live.title}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
        {total} produto{total !== 1 ? "s" : ""}
      </p>
    </a>
  );
}
