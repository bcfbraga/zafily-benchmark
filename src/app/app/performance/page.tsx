"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Eye, MousePointerClick, Percent, ExternalLink, Package, ChevronRight } from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { PullToRefresh } from "@/components/zafily/PullToRefresh";

interface Live {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  thumbnails?: string[];
  clicks?: number;
  views?: number;
  createdAt: string;
}

interface Profile {
  username: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex-1 min-w-[180px] bg-white border border-[var(--cr-border)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-brand-700)] shrink-0">
          {icon}
        </div>
        <span className="text-xs font-medium text-[var(--cr-text-secondary)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--cr-text-primary)]">{value}</p>
    </div>
  );
}

export default function PerformancePage() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"views" | "date">("views");

  function loadData() {
    return fetch("/api/dashboard").then(r => r.json()).then(d => {
      setLives(Array.isArray(d?.lives) ? d.lives : []);
      setProfile(d?.profile ?? null);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setLives(Array.isArray(d?.lives) ? d.lives : []);
      setProfile(d?.profile ?? null);
      setLoading(false);
    });
  }, []);

  const totalViews = lives.reduce((sum, l) => sum + (l.views ?? 0), 0);
  const totalClicks = lives.reduce((sum, l) => sum + (l.clicks ?? 0), 0);
  // Cliques por exibição, não CTR: cada exibição mostra vários produtos, então
  // a razão passa de 1 sem que nada esteja errado.
  const clicksPerView = totalViews > 0 ? totalClicks / totalViews : null;

  const ranked = lives
    .slice()
    .sort((a, b) => sortBy === "date"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (b.views ?? 0) - (a.views ?? 0));
  const maxViews = Math.max(1, ...ranked.map(l => l.views ?? 0));

  return (
    <>
      <Topbar title="Performance" description="Acompanhe visualizações e cliques das suas vitrines" />
      <PullToRefresh onRefresh={loadData} className="flex-1 scrollbar-hidden px-8 py-7">
        <div className="max-w-[900px] mx-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                {[1, 2, 3].map(i => <div key={i} className="flex-1 h-24 rounded-2xl bg-white border border-[var(--cr-border)] animate-pulse" />)}
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white border border-[var(--cr-border)] animate-pulse" />)}
              </div>
            </div>
          ) : lives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--cr-surface-soft)] flex items-center justify-center">
                <BarChart2 className="w-7 h-7 text-[var(--cr-brand-600)]" />
              </div>
              <div>
                <p className="font-heading font-semibold text-[var(--cr-text-primary)] text-lg">Sem dados ainda</p>
                <p className="text-[var(--cr-text-secondary)] text-sm mt-1 max-w-sm">
                  As visualizações e cliques aparecerão aqui assim que você publicar uma vitrine e compartilhar o link.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* KPI row */}
              <div className="flex gap-4 flex-wrap">
                <StatTile icon={<Eye className="w-3.5 h-3.5" />} label="Exibições totais" value={formatCount(totalViews)} />
                <StatTile icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Cliques totais" value={formatCount(totalClicks)} />
                <StatTile icon={<Percent className="w-3.5 h-3.5" />} label="Cliques por exibição" value={clicksPerView !== null ? clicksPerView.toFixed(1).replace(".", ",") : "—"} />
              </div>

              {/* Per-vitrine breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[var(--cr-text-primary)]">Por vitrine</h2>
                  <div className="flex items-center gap-1 bg-[var(--cr-surface-soft)] rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => setSortBy("views")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sortBy === "views" ? "bg-white shadow-sm text-[var(--cr-text-primary)]" : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)]"
                      }`}
                    >
                      Mais vistas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("date")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        sortBy === "date" ? "bg-white shadow-sm text-[var(--cr-text-primary)]" : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)]"
                      }`}
                    >
                      Mais recentes
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-[var(--cr-border)] rounded-2xl divide-y divide-[var(--cr-border)]">
                  {ranked.map(live => {
                    const views = live.views ?? 0;
                    const clicks = live.clicks ?? 0;
                    const liveClicksPerView = views > 0 && clicks > 0 ? clicks / views : null;
                    const barWidth = Math.max(4, (views / maxViews) * 100);
                    const thumb = live.thumbnails?.[0];
                    return (
                      <div
                        key={live.id}
                        onClick={() => router.push(`/app/performance/${live.id}`)}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--cr-surface-hover)] transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--cr-surface-soft)] overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                            : <Package className="w-4 h-4 text-[var(--cr-text-tertiary)]" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-sm font-medium text-[var(--cr-text-primary)] truncate">{live.title}</p>
                            {live.status === "draft" && (
                              <span className="text-[10px] font-semibold text-[var(--cr-text-tertiary)] shrink-0">Rascunho</span>
                            )}
                            {live.status === "published" && profile && (
                              <a
                                href={`/${profile.username}/${live.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[var(--cr-text-tertiary)] hover:text-[var(--cr-brand-600)] shrink-0 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <span className="text-[10px] text-[var(--cr-text-tertiary)] shrink-0">· criada em {formatDate(live.createdAt)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--cr-surface-soft)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--cr-brand-600)]" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0 [font-variant-numeric:tabular-nums]">
                          <div className="text-right w-14">
                            <p className="text-sm font-semibold text-[var(--cr-text-primary)]">{formatCount(views)}</p>
                            <p className="text-[10px] text-[var(--cr-text-tertiary)]">views</p>
                          </div>
                          <div className="text-right w-14">
                            <p className="text-sm font-semibold text-[var(--cr-text-primary)]">{formatCount(clicks)}</p>
                            <p className="text-[10px] text-[var(--cr-text-tertiary)]">cliques</p>
                          </div>
                          <div className="text-right w-12">
                            <p className="text-sm font-semibold text-[var(--cr-text-primary)]">{liveClicksPerView !== null ? liveClicksPerView.toFixed(1).replace(".", ",") : "—"}</p>
                            <p className="text-[10px] text-[var(--cr-text-tertiary)]">clq/exib.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--cr-text-tertiary)] shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
