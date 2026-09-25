"use client";

import { Package } from "lucide-react";
import { VitrineCarousel, type CarouselProduct } from "./VitrineCarousel";

export interface PreviewLive {
  id: string;
  title: string;
  status: "draft" | "published";
  liveDate: string | null;
  sectionId: string | null;
  imageUrl: string | null;
  productCount: number;
  discount?: number | null;
  showPrices?: boolean;
  previewProducts?: CarouselProduct[];
}

export interface PreviewSection {
  id: string;
  name: string;
  position: number;
}

export interface PreviewProfile {
  username: string;
  displayName: string | null;
  photoUrl: string | null;
}

const PLACEHOLDER_LIVES: PreviewLive[] = [
  { id: "p1", title: "Favoritos da semana", status: "published", liveDate: null, sectionId: null, imageUrl: null, productCount: 6, showPrices: true, discount: null, previewProducts: [] },
  { id: "p2", title: "Calças em alta", status: "published", liveDate: null, sectionId: null, imageUrl: null, productCount: 4, showPrices: true, discount: null, previewProducts: [] },
];

export function VitrinePreviewFrame({ profile, sections, lives }: {
  profile: PreviewProfile | null;
  sections: PreviewSection[];
  lives: PreviewLive[];
}) {
  const published = lives.filter(l => l.status === "published");
  const showLives = published.length > 0 ? published : PLACEHOLDER_LIVES;

  const liveShopping = showLives.filter(l => l.liveDate);
  const sectionGroups = sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(section => ({
      title: section.name,
      lives: showLives.filter(l => !l.liveDate && l.sectionId === section.id),
    }));
  const uncategorized = showLives.filter(l => !l.liveDate && !l.sectionId);

  const groups = [
    ...sectionGroups,
    { title: "Outras vitrines", lives: uncategorized },
    { title: "Vitrines de Live", lives: liveShopping },
  ].filter(g => g.lives.length > 0);

  const displayName = profile?.displayName || profile?.username || "Sua vitrine";

  // zf-public devolve os tokens públicos aqui dentro: o preview precisa mostrar
  // o que o visitante vê, não a marca do dashboard.
  return (
    <div
      className="zf-public w-[300px] h-[620px] rounded-[32px] border overflow-hidden flex flex-col"
      style={{
        background: "var(--cr-background)",
        borderColor: "var(--cr-border)",
        boxShadow: "var(--cr-shadow-floating)",
        color: "var(--cr-text-primary)",
        fontFamily: "var(--cr-font)",
      }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-8 pb-5 text-center">
          <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 flex items-center justify-center" style={{ background: "var(--cr-brand-50)" }}>
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold" style={{ color: "var(--cr-brand-400)" }}>{displayName[0]?.toUpperCase() ?? "?"}</span>
            )}
          </div>
          <p className="text-sm font-bold">{displayName}</p>
          <p className="text-[11px]" style={{ color: "var(--cr-text-tertiary)" }}>@{profile?.username ?? "..."}</p>
        </div>
        <div className="px-4 py-5">
          {groups.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--cr-text-tertiary)" }} />
              <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>Nenhuma vitrine publicada ainda.</p>
            </div>
          ) : groups.length === 1 ? (
            <div className="flex flex-col gap-6">
              {groups[0].lives.map(live => <PreviewSection key={live.id} live={live} />)}
            </div>
          ) : (
            groups.map(group => (
              <section key={group.title} className="mb-6 last:mb-0">
                <h2 className="text-[11px] font-semibold mb-2">{group.title}</h2>
                <div className="flex flex-col gap-6">
                  {group.lives.map(live => <PreviewSection key={live.id} live={live} />)}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ live }: { live: PreviewLive }) {
  return (
    <VitrineCarousel
      title={live.title}
      products={live.previewProducts ?? []}
      discount={live.discount ?? null}
      showPrices={live.showPrices ?? true}
      bannerImageUrl={live.liveDate ? live.imageUrl : null}
      interactive={false}
    />
  );
}
