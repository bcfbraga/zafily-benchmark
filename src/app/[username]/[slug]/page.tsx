import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { themeCssVars } from "@/lib/design-presets";
import Image from "next/image";
import { getPublicLive, getProfileByUsername, resolveCurrentUsername, resolveCurrentSlug, recordImpressions } from "@/lib/lives-store";
import { PublicFooter } from "@/components/zafily/PublicFooter";
import { ShareButtons } from "./ShareButtons";
import { ProductGrid } from "./ProductGrid";
import { Calendar, Clock } from "lucide-react";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${titleCase(username)} - Feito por Zafily` };
}

export default async function VitrinePage({ params }: Props) {
  const { username, slug } = await params;

  const [live, profile] = await Promise.all([
    getPublicLive(username, slug),
    getProfileByUsername(username),
  ]);

  if (!live || !profile) {
    if (!profile) {
      const currentUsername = await resolveCurrentUsername(username);
      if (currentUsername) redirect(`/${currentUsername}/${slug}`);
      notFound();
    }
    const currentSlug = await resolveCurrentSlug(profile.userId, slug);
    if (currentSlug) redirect(`/${username}/${currentSlug}`);
    notFound();
  }

  await recordImpressions([live.id]);

  return (
    <div
      className="min-h-screen"
      style={{
        // O tema do perfil sobrescreve os tokens --cr-*; sem tema, cai no padrão
        ...themeCssVars(profile.designSettings, profile.photoUrl),
        background: "var(--cr-background)",
        color: "var(--cr-text-primary)",
        fontFamily: "var(--cr-font)",
      }}
    >

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="hidden sm:block sticky top-0 z-10" style={{ background: "var(--cr-background)", borderBottom: "1px solid var(--cr-border)" }}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--cr-text-tertiary)" }}>
            Vitrine
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--cr-text-secondary)" }}>@{profile.username}</span>
        </div>
      </header>

      {/* Cover image — full-bleed edge-to-edge on mobile, contained on desktop */}
      {live.imageUrl && (
        <div className="w-full sm:max-w-3xl sm:mx-auto sm:px-5 sm:pt-10">
          <div className="w-full h-auto sm:h-72 sm:rounded-[var(--cr-radius-xl)] overflow-hidden sm:mb-4" style={{ background: "var(--cr-surface-soft)" }}>
            <Image
              src={live.imageUrl}
              alt={live.title}
              width={1600}
              height={900}
              sizes="(max-width: 640px) 100vw, 700px"
              priority
              className="w-full h-auto sm:h-full object-contain sm:object-cover"
            />
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 pt-6 sm:pt-10 pb-8">
        {/* Title block */}
        <div className="mb-2">
          {live.showTitle && (
            <h1 className="cr-page-title mb-4" style={{ fontSize: "clamp(28px, 4.5vw, 40px)" }}>
              {live.title}
            </h1>
          )}

          {/* Meta pills */}
          <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
            {live.liveDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(live.liveDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
              </span>
            )}
            {live.liveTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {live.liveTime.slice(0, 5)}
              </span>
            )}
            <span>{live.products.length} produto{live.products.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="mt-6 mb-8" style={{ borderTop: "1px solid var(--cr-border)" }} />

        {/* ── Products ──────────────────────────────────────────── */}
        {live.products.length === 0 ? (
          <div className="cr-empty-state">
            <p className="cr-body-text">
              Os produtos serão adicionados em breve. Volte mais tarde.
            </p>
          </div>
        ) : (
          <ProductGrid products={live.products} discount={live.discount} discountType={live.discountType} couponCode={live.couponCode} showPrices={live.showPrices} />
        )}
      </div>

      {/* ── Share section ───────────────────────────────────────── */}
      <div className="mt-8" style={{ borderTop: "1px solid var(--cr-border)" }}>
        <div className="max-w-3xl mx-auto px-5 py-12 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--cr-text-tertiary)" }}>
            Gostou das escolhas?
          </p>
          <h2 className="cr-section-title mb-1" style={{ fontSize: "clamp(20px, 3vw, 24px)" }}>
            Compartilhe com uma amiga
          </h2>
          <p className="cr-body-text mb-8">
            Mande o link para ela conferir os produtos também.
          </p>
          <ShareButtons title={live.title} username={profile.username} slug={live.slug} />
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
