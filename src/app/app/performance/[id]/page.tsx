"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, MousePointerClick, Percent, ExternalLink,
  Package, Trophy, Table2,
} from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { PullToRefresh } from "@/components/zafily/PullToRefresh";

interface ProductStat {
  id: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  clicks: number;
}

interface Performance {
  live: { id: string; title: string; slug: string; status: "draft" | "published" };
  views: number;
  products: ProductStat[];
  clickTimestamps: string[];
}

interface Profile {
  username: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

// ── Timeline bucketing ────────────────────────────────────────────────────

interface Bucket { start: number; count: number; label: string }

type Granularity = "minuto" | "hora" | "dia";

const GRANULARITY_MS: Record<Granularity, number> = {
  minuto: 60_000,
  hora: 3_600_000,
  dia: 86_400_000,
};

const GRANULARITY_LABEL: Record<Granularity, string> = {
  minuto: "Minuto",
  hora: "Hora",
  dia: "Dia",
};

// Above this many buckets a granularity option is disabled — the bar chart
// would need thousands of DOM nodes and stop being readable even scrolled.
const MAX_BUCKETS = 1500;

function bucketCount(timestamps: string[], granularity: Granularity): number {
  if (timestamps.length === 0) return 0;
  const times = timestamps.map(t => new Date(t).getTime());
  const bucketMs = GRANULARITY_MS[granularity];
  const first = Math.floor(Math.min(...times) / bucketMs) * bucketMs;
  const last = Math.floor(Math.max(...times) / bucketMs) * bucketMs;
  return Math.round((last - first) / bucketMs) + 1;
}

function autoGranularity(timestamps: string[]): Granularity {
  if (timestamps.length < 2) return "hora";
  const times = timestamps.map(t => new Date(t).getTime());
  const spanHours = (Math.max(...times) - Math.min(...times)) / 3_600_000;
  if (spanHours <= 3 && bucketCount(timestamps, "minuto") <= MAX_BUCKETS) return "minuto";
  if (spanHours <= 48) return "hora";
  return "dia";
}

function buildTimeline(timestamps: string[], granularity: Granularity): Bucket[] {
  if (timestamps.length === 0) return [];

  const bucketMs = GRANULARITY_MS[granularity];
  const times = timestamps.map(t => new Date(t).getTime()).sort((a, b) => a - b);
  const first = times[0];
  const last = times[times.length - 1];

  const bucketStart = (t: number) => Math.floor(t / bucketMs) * bucketMs;
  const counts = new Map<number, number>();
  for (const t of times) {
    const b = bucketStart(t);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }

  const startBucket = bucketStart(first);
  const endBucket = bucketStart(last);
  const buckets: Bucket[] = [];
  for (let t = startBucket; t <= endBucket; t += bucketMs) {
    const d = new Date(t);
    const label = granularity === "dia"
      ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      : granularity === "hora"
        ? `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit" }).replace(":", "")}`
        : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    buckets.push({ start: t, count: counts.get(t) ?? 0, label });
  }
  return buckets;
}

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];

function niceCeil(n: number): number {
  if (n <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const residual = n / magnitude;
  const niceResidual = NICE_STEPS.find(step => step >= residual) ?? 10;
  return Math.round(niceResidual * magnitude);
}

const PLOT_HEIGHT = 128; // px — the bars' content box; x-axis labels live below it
const MIN_SLOT = 10; // px — minimum width per bar column before the chart scrolls

function TimelineChart({ timestamps }: { timestamps: string[] }) {
  const [granularity, setGranularity] = useState<Granularity>(() => autoGranularity(timestamps));
  const buckets = useMemo(() => buildTimeline(timestamps, granularity), [timestamps, granularity]);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const maxCount = Math.max(1, ...buckets.map(b => b.count));
  const axisMax = niceCeil(maxCount);
  const plotWidth = `max(100%, ${buckets.length * MIN_SLOT}px)`;

  if (buckets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <p className="text-sm text-[var(--cr-text-tertiary)]">Ainda não há cliques registrados.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-[var(--cr-surface-soft)] rounded-full p-1">
          {(Object.keys(GRANULARITY_MS) as Granularity[]).map(g => {
            const disabled = g !== granularity && bucketCount(timestamps, g) > MAX_BUCKETS;
            return (
              <button
                key={g}
                type="button"
                disabled={disabled}
                onClick={() => setGranularity(g)}
                title={disabled ? "Período muito longo para essa granularidade" : undefined}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  granularity === g
                    ? "bg-white shadow-sm text-[var(--cr-text-primary)]"
                    : disabled
                      ? "text-[var(--cr-text-tertiary)] opacity-40 cursor-not-allowed"
                      : "text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)]"
                }`}
              >
                {GRANULARITY_LABEL[g]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowTable(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--cr-text-secondary)] hover:text-[var(--cr-brand-600)] transition-colors"
        >
          <Table2 className="w-3.5 h-3.5" /> {showTable ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--cr-border)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--cr-surface-soft)]">
              <tr>
                <th className="text-left font-semibold text-[var(--cr-text-secondary)] px-4 py-2">Período</th>
                <th className="text-right font-semibold text-[var(--cr-text-secondary)] px-4 py-2">Cliques</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              {buckets.map((b, i) => (
                <tr key={i} className="border-t border-[var(--cr-border)]">
                  <td className="px-4 py-2 text-[var(--cr-text-primary)]">{b.label}</td>
                  <td className="px-4 py-2 text-right text-[var(--cr-text-primary)]">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Y-axis reference labels */}
          <div className="flex flex-col justify-between text-right w-7 shrink-0 [font-variant-numeric:tabular-nums]" style={{ height: PLOT_HEIGHT }}>
            <span className="text-[9px] text-[var(--cr-text-tertiary)] leading-none">{axisMax}</span>
            <span className="text-[9px] text-[var(--cr-text-tertiary)] leading-none">{Math.round(axisMax / 2)}</span>
            <span className="text-[9px] text-[var(--cr-text-tertiary)] leading-none">0</span>
          </div>

          {/* Plot area — scrolls horizontally once bars are too dense to read */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden" onMouseLeave={() => setHover(null)}>
            <div className="relative" style={{ height: PLOT_HEIGHT + 24, width: plotWidth }}>
              {/* Reference gridlines */}
              <div className="absolute inset-x-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height: PLOT_HEIGHT }}>
                <div className="border-t border-[var(--cr-border)]" />
                <div className="border-t border-[var(--cr-border)]" />
                <div className="border-t border-[var(--cr-border)]" />
              </div>

              {/* Bars */}
              <div className="absolute inset-x-0 top-0 flex items-end gap-[3px]" style={{ height: PLOT_HEIGHT }}>
                {buckets.map((b, i) => {
                  const heightPct = Math.max(b.count > 0 ? 3 : 0, (b.count / axisMax) * 100);
                  const isFirst = i === 0;
                  const isLast = i === buckets.length - 1;
                  const isMid = i === Math.floor((buckets.length - 1) / 2) && buckets.length > 6;
                  return (
                    <button
                      key={b.start}
                      type="button"
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="relative flex-1 h-full flex flex-col items-center justify-end min-w-[3px] outline-none"
                      aria-label={`${b.label}: ${b.count} clique${b.count !== 1 ? "s" : ""}`}
                    >
                      {hover === i && (
                        <div className="absolute bottom-full mb-2 z-10 whitespace-nowrap bg-[var(--cr-text-primary)] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none">
                          <span className="font-semibold">{b.count}</span> clique{b.count !== 1 ? "s" : ""}
                          <div className="text-[10px] text-white/70">{b.label}</div>
                        </div>
                      )}
                      <div
                        className="w-full max-w-[22px] rounded-t-[4px] transition-colors"
                        style={{
                          height: `${heightPct}%`,
                          background: hover === i ? "var(--cr-brand-700)" : "var(--cr-brand-500)",
                        }}
                      />
                      {(isFirst || isLast || isMid) && (
                        <span className="absolute -bottom-5 text-[9px] text-[var(--cr-text-tertiary)] whitespace-nowrap">
                          {b.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function VitrinePerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Performance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  function loadData() {
    return Promise.all([
      fetch(`/api/lives/${id}/performance`).then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      }),
      fetch("/api/profile").then(r => r.json()),
    ])
      .then(([perfData, profileData]) => {
        setData(perfData);
        setProfile(profileData ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/lives/${id}/performance`).then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      }),
      fetch("/api/profile").then(r => r.json()),
    ])
      .then(([perfData, profileData]) => {
        setData(perfData);
        setProfile(profileData ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const totalClicks = data?.products.reduce((sum, p) => sum + p.clicks, 0) ?? 0;
  const clicksPerView = data && data.views > 0 ? totalClicks / data.views : null;
  const maxProductClicks = Math.max(1, ...(data?.products.map(p => p.clicks) ?? [1]));
  const topClicked = data?.products.filter(p => p.clicks > 0).slice(0, 3).map(p => p.id) ?? [];

  return (
    <>
      <Topbar
        title={data?.live.title ?? "Performance"}
        description="Detalhe de visualizações e cliques desta vitrine"
        action={
          <Link
            href="/app/performance"
            className="flex items-center gap-1.5 h-8 px-4 bg-white border border-[var(--cr-border)] hover:border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] text-xs font-semibold rounded-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
        }
      />
      <PullToRefresh onRefresh={loadData} className="flex-1 scrollbar-hidden px-8 py-7">
        <div className="max-w-[900px] mx-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                {[1, 2, 3].map(i => <div key={i} className="flex-1 h-24 rounded-2xl bg-white border border-[var(--cr-border)] animate-pulse" />)}
              </div>
              <div className="h-56 rounded-2xl bg-white border border-[var(--cr-border)] animate-pulse" />
            </div>
          ) : notFound || !data ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
              <p className="text-[var(--cr-text-primary)] font-semibold">Vitrine não encontrada</p>
              <Link href="/app/performance" className="text-sm text-[var(--cr-brand-600)] hover:underline">Voltar para Performance</Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Title row */}
              <div className="flex items-center gap-2 -mt-2">
                {data.live.status === "published" && profile && (
                  <a
                    href={`/${profile.username}/${data.live.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[var(--cr-text-tertiary)] hover:text-[var(--cr-brand-600)] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver página pública
                  </a>
                )}
              </div>

              {/* KPI row */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[180px] bg-white border border-[var(--cr-border)] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-brand-700)] shrink-0"><Eye className="w-3.5 h-3.5" /></div>
                    <span className="text-xs font-medium text-[var(--cr-text-secondary)]">Exibições</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--cr-text-primary)]">{formatCount(data.views)}</p>
                </div>
                <div className="flex-1 min-w-[180px] bg-white border border-[var(--cr-border)] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-brand-700)] shrink-0"><MousePointerClick className="w-3.5 h-3.5" /></div>
                    <span className="text-xs font-medium text-[var(--cr-text-secondary)]">Cliques totais</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--cr-text-primary)]">{formatCount(totalClicks)}</p>
                </div>
                <div className="flex-1 min-w-[180px] bg-white border border-[var(--cr-border)] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-brand-700)] shrink-0"><Percent className="w-3.5 h-3.5" /></div>
                    <span className="text-xs font-medium text-[var(--cr-text-secondary)]">Cliques por exibição</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--cr-text-primary)]">{clicksPerView !== null ? clicksPerView.toFixed(1).replace(".", ",") : "—"}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-[var(--cr-border)] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-[var(--cr-text-primary)] mb-1">Timeline de cliques</h2>
                <TimelineChart timestamps={data.clickTimestamps} />
              </div>

              {/* Products */}
              <div>
                <h2 className="text-sm font-semibold text-[var(--cr-text-primary)] mb-3">Produtos mais clicados</h2>
                {data.products.length === 0 ? (
                  <p className="text-sm text-[var(--cr-text-tertiary)]">Nenhum produto nesta vitrine.</p>
                ) : (
                  <div className="bg-white border border-[var(--cr-border)] rounded-2xl divide-y divide-[var(--cr-border)]">
                    {data.products.map((p, i) => {
                      const barWidth = Math.max(4, (p.clicks / maxProductClicks) * 100);
                      const isTop = topClicked.includes(p.id);
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                          <span className="w-5 text-xs font-semibold text-[var(--cr-text-tertiary)] text-right shrink-0 [font-variant-numeric:tabular-nums]">{i + 1}</span>
                          <div className="w-10 h-10 rounded-lg bg-[var(--cr-surface-soft)] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-[var(--cr-text-tertiary)]" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <p className="text-sm font-medium text-[var(--cr-text-primary)] truncate">{p.name ?? "Sem nome"}</p>
                              {isTop && p.clicks > 0 && (
                                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--cr-surface-soft)] overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--cr-brand-600)]" style={{ width: `${barWidth}%` }} />
                            </div>
                          </div>
                          <div className="text-right w-16 shrink-0 [font-variant-numeric:tabular-nums]">
                            <p className="text-sm font-semibold text-[var(--cr-text-primary)]">{formatCount(p.clicks)}</p>
                            <p className="text-[10px] text-[var(--cr-text-tertiary)]">cliques</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
