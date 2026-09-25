import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { themeCssVars } from "@/lib/design-presets";
import { getPublicGallery, resolveCurrentUsername, recordImpressions, type Live } from "@/lib/lives-store";
import { VitrineCarousel } from "@/components/zafily/VitrineCarousel";
import { LiveGridCard } from "@/components/zafily/LiveGridCard";
import { PublicFooter } from "@/components/zafily/PublicFooter";
import { PublicProfileHeader } from "@/components/zafily/PublicProfileHeader";
import { PublicProfileTabs } from "@/components/zafily/PublicProfileTabs";
import { Package, Radio, Layers } from "lucide-react";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${titleCase(username)} - Feito por Zafily` };
}

function VitrineSection({ live, username }: { live: Live; username: string }) {
  return (
    <VitrineCarousel
      title={live.title}
      products={live.previewProducts ?? []}
      discount={live.discount}
      showPrices={live.showPrices}
      viewMoreHref={`/${username}/${live.slug}`}
      bannerImageUrl={live.liveDate ? live.imageUrl : null}
      productHrefBase="/api/click"
    />
  );
}

export default async function VitrinesIndexPage({ params }: Props) {
  const { username } = await params;

  const result = await getPublicGallery(username);

  if (!result) {
    const currentUsername = await resolveCurrentUsername(username);
    if (currentUsername) redirect(`/${currentUsername}/vitrines`);
    notFound();
  }

  const { profile, sections, lives } = result;

  // Os cliques do carrossel saem daqui, então a exibição precisa ser contada
  // aqui também — senão o denominador do CTR fica menor que o de cliques.
  await recordImpressions(lives.map(l => l.id));

  const liveShopping = lives.filter(l => l.liveDate);
  const sectionGroups = sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(section => ({
      title: section.name,
      icon: <Layers className="w-4 h-4" style={{ color: "var(--cr-brand-600)" }} />,
      lives: lives.filter(l => !l.liveDate && l.sectionId === section.id),
    }));
  const uncategorized = lives.filter(l => !l.liveDate && !l.sectionId);

  // As lives entram em grade (capa + prévia dos produtos + contagem); as demais
  // seções seguem como carrossel, que é onde a navegação horizontal ajuda.
  const groups = [
    ...sectionGroups.map(g => ({ ...g, grid: false })),
    { title: "Outras vitrines", icon: undefined as React.ReactNode, lives: uncategorized, grid: false },
    { title: "Vitrines de Live", icon: <Radio className="w-4 h-4" style={{ color: "var(--cr-brand-600)" }} />, lives: liveShopping, grid: true },
  ].filter(g => g.lives.length > 0);

  function renderGroupBody(group: (typeof groups)[number]) {
    if (group.grid) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
          {group.lives.map(live => (
            <LiveGridCard key={live.id} live={live} username={profile.username} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-y-10">
        {group.lives.map(live => (
          <VitrineSection key={live.id} live={live} username={profile.username} />
        ))}
      </div>
    );
  }

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
      <PublicProfileHeader profile={profile} />
      <div className="max-w-2xl mx-auto px-5">
        <PublicProfileTabs username={profile.username} />
      </div>

      {/* ── Vitrines gallery ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 pb-20">
        {groups.length === 0 ? (
          <div className="cr-empty-state">
            <Package className="w-7 h-7 mb-3" style={{ color: "var(--cr-text-tertiary)" }} />
            <p className="cr-body-text">Nenhuma vitrine publicada ainda.</p>
          </div>
        ) : groups.length === 1 ? (
          renderGroupBody(groups[0])
        ) : (
          groups.map(group => (
            <section key={group.title} className="mb-10 last:mb-0">
              <div className="flex items-center gap-2 mb-4">
                {group.icon}
                <h2 className="cr-card-title">{group.title}</h2>
              </div>
              {renderGroupBody(group)}
            </section>
          ))
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
