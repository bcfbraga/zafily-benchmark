"use client";

import { useRef } from "react";
import Image from "next/image";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";
import { titleCase, discountedPrice } from "@/lib/utils";

export interface CarouselProduct {
  id: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
}

interface ProductMiniCardProps {
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  discount: number | null;
  showPrices: boolean;
  href?: string;
}

function ProductMiniCard({ name, imageUrl, price, discount, showPrices, href }: ProductMiniCardProps) {
  const disc = showPrices ? discountedPrice(price, discount) : null;
  const Tag = href ? "a" : "div";
  return (
    <Tag
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group w-[210px] shrink-0 block"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-[var(--cr-radius-lg)]" style={{ background: "var(--cr-surface-soft)" }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name ?? ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6" style={{ color: "var(--cr-text-tertiary)" }} />
          </div>
        )}
      </div>
      <div className="pt-2.5">
        <p className="text-[13px] font-medium leading-snug line-clamp-1 mb-1" style={{ color: "var(--cr-text-primary)" }}>
          {name ? titleCase(name) : "Produto"}
        </p>
        {showPrices && (
          disc ? (
            <div>
              <p className="text-[11px] line-through" style={{ color: "var(--cr-text-tertiary)" }}>{disc.original}</p>
              <p className="text-sm font-bold" style={{ color: "var(--cr-brand-700)" }}>{disc.discounted}</p>
            </div>
          ) : price ? (
            <p className="text-sm font-bold" style={{ color: "var(--cr-text-primary)" }}>{price}</p>
          ) : null
        )}
      </div>
    </Tag>
  );
}

function FullBanner({ imageUrl, href }: { imageUrl: string; href?: string }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block"
    >
      <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-[var(--cr-radius-lg)]" style={{ background: "var(--cr-surface-soft)" }}>
        {/* Capa hospedada no Supabase — passa pelo otimizador da Vercel.
            Os produtos abaixo ficam em <img> por serem imagens externas das lojas. */}
        <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 1100px" className="object-cover" />
      </div>
    </Tag>
  );
}

export function VitrineCarousel({ title, products, discount, showPrices, viewMoreHref, bannerImageUrl, productHrefBase, interactive = true }: {
  title: string;
  products: CarouselProduct[];
  discount: number | null;
  showPrices: boolean;
  viewMoreHref?: string;
  bannerImageUrl?: string | null;
  productHrefBase?: string;
  interactive?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const showArrows = interactive && products.length > 2;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="cr-card-title truncate">{title}</h3>
        {interactive && viewMoreHref && (
          <a
            href={viewMoreHref}
            className="flex items-center gap-0.5 text-xs font-semibold shrink-0 transition-colors"
            style={{ color: "var(--cr-brand-700)" }}
          >
            Ver mais <ChevronRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {bannerImageUrl ? (
        <FullBanner imageUrl={bannerImageUrl} href={interactive ? viewMoreHref : undefined} />
      ) : products.length === 0 ? (
        <div className="cr-showcase-card flex items-center justify-center py-10">
          <Package className="w-6 h-6" style={{ color: "var(--cr-text-tertiary)" }} />
        </div>
      ) : (
        <div className="relative">
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Anterior"
                className="hidden sm:flex absolute left-1 top-[38%] -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-opacity"
                style={{ background: "rgba(36,27,53,0.55)", backdropFilter: "blur(4px)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Próximo"
                className="hidden sm:flex absolute right-1 top-[38%] -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-opacity"
                style={{ background: "rgba(36,27,53,0.55)", backdropFilter: "blur(4px)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: "none" }}>
            {products.map(p => (
              <ProductMiniCard
                key={p.id}
                name={p.name}
                imageUrl={p.imageUrl}
                price={p.price}
                discount={discount}
                showPrices={showPrices}
                href={interactive && productHrefBase ? `${productHrefBase}/${p.id}` : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
