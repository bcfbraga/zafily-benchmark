"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, X, Upload, Calendar, Clock,
  Package, CheckCircle2, FileText, ExternalLink, Pencil,
  Copy, Check, GripVertical, Plus, ShoppingBag, Smartphone, Monitor,
  Eye, EyeOff, AlertTriangle, Info, Layers, Undo2
} from "lucide-react";
import { StoreSelect } from "@/components/zafily/StoreSelect";
import { SectionSelect } from "@/components/zafily/SectionSelect";
import { ActivationModal } from "@/components/zafily/ActivationModal";
import { SplitEditorLayout } from "@/components/zafily/SplitEditorLayout";
import { Modal } from "@/components/zafily/Modal";
import { titleCase, discountLabel, compareByCategory } from "@/lib/utils";
import { parseProductInput } from "@/lib/product-paste";
import type { AccountStatus } from "@/lib/lives-store";
import type { ImportReport } from "@/lib/link-import";

interface Product {
  id: string;
  url: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  category: string | null;
  size: string | null;
  position: number;
  clicks?: number;
  importStatus: "ok" | "partial" | "failed" | null;
  importError: string | null;
}

/**
 * Estado de importação de um produto. Produtos gravados antes da coluna
 * `import_status` existir vêm com `null`; nesses o estado se deduz dos campos
 * vazios, que é a mesma regra usada na gravação.
 */
function importIssue(p: Product): { level: "failed" | "partial"; message: string } | null {
  const temNome = !!p.name?.trim();
  const temImagem = !!p.imageUrl?.trim();

  if (p.importStatus === "ok") return null;
  if (p.importStatus === "failed") {
    return { level: "failed", message: p.importError ?? "Não foi possível ler este link." };
  }
  if (p.importStatus === "partial") {
    return { level: "partial", message: p.importError ?? "Faltaram dados neste link." };
  }

  // importStatus === null → produto anterior à migration
  if (!temNome && !temImagem) return { level: "failed", message: "Este link não trouxe nome nem imagem." };
  if (!temNome) return { level: "partial", message: "O nome do produto não foi encontrado." };
  if (!temImagem) return { level: "partial", message: "A imagem do produto não foi encontrada." };
  return null;
}

/** Encurta a URL para caber na lista sem virar uma parede de texto. */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const caminho = u.pathname.replace(/\/+$/, "");
    const texto = `${u.hostname.replace(/^www\./, "")}${caminho}`;
    return texto.length > 52 ? `${texto.slice(0, 52)}…` : texto;
  } catch {
    return url.length > 52 ? `${url.slice(0, 52)}…` : url;
  }
}

interface Live {
  id: string;
  title: string;
  slug: string;
  liveDate: string | null;
  liveTime: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  store: string | null;
  discount: number | null;
  discountType: "cart" | "coupon";
  couponCode: string | null;
  sectionId: string | null;
  showPrices: boolean;
  showTitle: boolean;
  updatedAt: string;
  products: Product[];
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Publicada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] border border-black/[0.12]">
      <FileText className="w-3 h-3" /> Rascunho
    </span>
  );
}

function shortCat(cat: string | null) {
  if (!cat) return null;
  const parts = cat.split("/").map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

// ── Price helpers ────────────────────────────────────────────────────────────
function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  // Remove currency symbol and spaces, keep digits, dots and commas
  const clean = raw.replace(/[^\d.,]/g, "");
  // If both dot and comma exist: last one is decimal separator (e.g. "1.299,90" or "1,299.90")
  const lastDot   = clean.lastIndexOf(".");
  const lastComma = clean.lastIndexOf(",");
  let normalized: string;
  if (lastDot > -1 && lastComma > -1) {
    // whichever comes last is the decimal separator
    normalized = lastComma > lastDot
      ? clean.replace(/\./g, "").replace(",", ".")
      : clean.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = clean.replace(",", ".");
  } else {
    normalized = clean;
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function discountedPrice(raw: string | null, pct: number | null): { original: string; discounted: string } | null {
  if (!pct || !raw) return null;
  const base = parsePrice(raw);
  if (!base) return null;
  return { original: raw.trim(), discounted: formatBRL(base * (1 - pct / 100)) };
}

// ── Live preview (right panel) ───────────────────────────────────────────────
function VitrinePreview({ live, onReorder }: { live: Live; onReorder?: (newProducts: Product[]) => void }) {
  const [activeCategory, setActiveCategory] = useState("Tudo");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"mobile" | "web">("mobile");
  const isMobile = previewMode === "mobile";

  const products = live.products.map(p => ({ ...p, category: shortCat(p.category) }));
  const categories = ["Tudo", ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];
  const filteredWithOrig = products
    .map((p, origIdx) => ({ ...p, origIdx }))
    .filter(p => activeCategory === "Tudo" || p.category === activeCategory);
  const filtered = filteredWithOrig;

  function handleDrop() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const fromOrig = filteredWithOrig[dragIdx].origIdx;
    const toOrig   = filteredWithOrig[overIdx].origIdx;
    const newProducts = [...live.products];
    const [moved] = newProducts.splice(fromOrig, 1);
    newProducts.splice(toOrig, 0, moved);
    onReorder?.(newProducts);
    setDragIdx(null); setOverIdx(null);
  }

  return (
    <div className="min-h-full bg-[#EFEFF4] text-zinc-900 font-sans">
      {/* Sticky mini header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">Preview</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-full p-0.5">
              <button
                onClick={() => setPreviewMode("mobile")}
                title="Visualizar como mobile"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isMobile ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewMode("web")}
                title="Visualizar como web"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${!isMobile ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-zinc-300">{live.status === "draft" ? "Rascunho" : "Publicada"}</span>
          </div>
        </div>
      </div>

      <div className={isMobile ? "flex justify-center py-6 px-4" : "px-5 pt-8 pb-16"}>
        <div className={isMobile ? "w-[390px] max-w-full rounded-[32px] border border-zinc-200 shadow-lg overflow-hidden bg-white" : "max-w-2xl mx-auto"}>
          <div className={isMobile ? "pb-10" : ""}>
            {/* Cover image */}
            {live.imageUrl && (
              <div className={isMobile ? "w-full h-auto bg-zinc-100 overflow-hidden" : "w-full h-44 rounded-2xl overflow-hidden mb-7 bg-zinc-100"}>
                <img src={live.imageUrl} alt={live.title} className={isMobile ? "w-full h-auto object-contain" : "w-full h-full object-cover"} />
              </div>
            )}

            <div className={isMobile ? "px-4 pt-4" : ""}>
              {/* Title */}
              {live.showTitle && (
                <h1 className="text-2xl font-bold text-zinc-900 mb-5">{live.title || "Sua vitrine"}</h1>
              )}

              {/* Category tabs */}
              {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap mb-6">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`h-8 px-4 rounded-full text-xs font-semibold border transition-colors ${
                        activeCategory === cat
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Products grid */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-300">
                  <ShoppingBag className="w-10 h-10" />
                  <p className="text-sm">Nenhum produto ainda</p>
                </div>
              ) : (
                <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                  {filtered.map((p, i) => {
                    const disc = live.showPrices ? discountedPrice(p.price, live.discount) : null;
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
                        onDrop={handleDrop}
                        onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                        className={`rounded-2xl overflow-hidden border bg-white shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                          overIdx === i && dragIdx !== i ? "border-violet-400 scale-[1.02]" : dragIdx === i ? "border-zinc-200 opacity-40" : "border-zinc-100"
                        }`}
                      >
                        <div className="relative aspect-[3/4] bg-zinc-50 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name ?? ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                          {disc && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#8C2F45] text-white text-[10px] font-bold shadow">
                              -{live.discount}%
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          {p.category && (
                            <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">{p.category}</p>
                          )}
                          <p className="text-xs font-medium text-zinc-800 line-clamp-2 leading-snug mb-1">
                            {p.name ? titleCase(p.name) : "Produto"}
                          </p>
                          {p.size && (
                            <div className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-bold mb-1.5 bg-violet-100 text-violet-700">
                              Tamanho {p.size}
                            </div>
                          )}
                          {disc ? (
                            <div>
                              <p className="text-[10px] text-zinc-400 line-through leading-none">{disc.original}</p>
                              <p className="text-sm font-bold text-[#8C2F45] leading-tight">{disc.discounted}</p>
                              <p className="text-[9px] text-[#B37A87] font-medium mt-0.5">{discountLabel(live.discountType, live.couponCode)}</p>
                            </div>
                          ) : (
                            live.showPrices && p.price && <p className="text-xs font-bold text-zinc-900">{p.price}</p>
                          )}
                          <div className="mt-2 w-full h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-[10px] font-semibold tracking-wide">
                            VER PRODUTO →
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Relatório da importação ──────────────────────────────────────────────────
// Antes disto, link quebrado e link repetido desapareciam sem aviso: o produto
// entrava vazio ou simplesmente não entrava, e a usuária só descobria ao abrir
// a vitrine publicada.

const TONES = {
  danger: {
    box: "border-red-200 bg-red-50",
    title: "text-red-800",
    note: "text-red-700",
    url: "text-red-900",
  },
  warning: {
    box: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    note: "text-amber-800",
    url: "text-amber-950",
  },
  neutral: {
    box: "border-black/[0.10] bg-[var(--cr-surface-soft)]",
    title: "text-[var(--cr-text-primary)]",
    note: "text-[var(--cr-text-tertiary)]",
    url: "text-[var(--cr-text-secondary)]",
  },
} as const;

function ReportGroup({
  tone, icon: Icon, title, items,
}: {
  tone: keyof typeof TONES;
  icon: React.ElementType;
  title: string;
  items: { url: string; note: string }[];
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border ${t.box} px-3 py-2.5`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${t.title}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {title}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item, i) => (
          <li key={`${item.url}-${i}`} className="leading-tight">
            <span className={`block text-[11px] font-medium break-all ${t.url}`}>{shortUrl(item.url)}</span>
            <span className={`block text-[10px] ${t.note}`}>{item.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImportReportPanel({ report, onDismiss }: { report: ImportReport; onDismiss: () => void }) {
  const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">
          Resultado da importação
        </p>
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.05] transition-colors"
          title="Dispensar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {report.failed.length > 0 && (
        <ReportGroup
          tone="danger"
          icon={AlertTriangle}
          title={`${report.failed.length} ${plural(report.failed.length, "link com erro", "links com erro")}`}
          items={report.failed.map(f => ({ url: f.url, note: f.reason }))}
        />
      )}

      {report.partial.length > 0 && (
        <ReportGroup
          tone="warning"
          icon={AlertTriangle}
          title={`${report.partial.length} ${plural(report.partial.length, "link incompleto", "links incompletos")}`}
          items={report.partial.map(f => ({ url: f.url, note: f.reason }))}
        />
      )}

      {report.duplicates.length > 0 && (
        <ReportGroup
          tone="neutral"
          icon={Copy}
          title={`${report.duplicates.length} ${plural(report.duplicates.length, "link duplicado", "links duplicados")} — não ${plural(report.duplicates.length, "foi adicionado", "foram adicionados")}`}
          items={report.duplicates.map(d => ({
            url: d.url,
            note: d.scope === "vitrine" ? "Este produto já está na vitrine." : "Repetido na lista que você colou.",
          }))}
        />
      )}

      {report.invalid.length > 0 && (
        <ReportGroup
          tone="neutral"
          icon={Info}
          title={`${report.invalid.length} ${plural(report.invalid.length, "entrada ignorada", "entradas ignoradas")}`}
          items={report.invalid.map(url => ({ url, note: "Não é um link válido." }))}
        />
      )}

      <p className="text-[10px] text-[var(--cr-text-tertiary)]">
        Os links com erro entraram na lista mesmo assim, marcados — edite o produto para
        preencher à mão, ou remova.
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function EditLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [live, setLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(true);
  const [urlsText, setUrlsText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ accountStatus: AccountStatus; displayName: string | null; username: string; instagramHandle: string | null } | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [sizeInputVal, setSizeInputVal] = useState("");
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  // Ordem anterior ao agrupamento, para o desfazer. Agrupar 49 produtos num
  // clique destrói uma ordenação feita à mão, e a vitrine pode já estar no ar.
  const [orderBeforeGrouping, setOrderBeforeGrouping] = useState<Product[] | null>(null);
  const [grouping, setGrouping] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/lives/${id}`).then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([liveData, profileData]) => {
      setLive(liveData);
      setUsername(profileData?.username ?? null);
      setProfile(profileData ?? null);
      setLoading(false);
    });
  }, [id]);

  // The delete button is always visible on touch screens, so it arms first and
  // only removes on a second tap — an accidental tap disarms itself.
  useEffect(() => {
    if (!confirmRemoveId) return;
    const timer = setTimeout(() => setConfirmRemoveId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmRemoveId]);

  const productItems = parseProductInput(urlsText);
  const productCount = live?.products.length ?? 0;
  const productsWithIssues = (live?.products ?? []).filter(p => importIssue(p)).length;
  const productsWithoutCategory = (live?.products ?? []).filter(p => !shortCat(p.category)).length;
  const slotsLeft = 100 - productCount;

  async function fetchProducts() {
    if (productItems.length === 0) return;
    setFetching(true);
    setFetchError(null);
    const res = await fetch(`/api/lives/${id}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: productItems }),
    });
    const data = await res.json();
    setFetching(false);
    if (!res.ok) { setFetchError(data.error ?? "Erro ao buscar produtos"); return; }
    setLive(prev => prev ? { ...prev, products: [...prev.products, ...data.products] } : prev);

    // O painel só aparece quando há algo a dizer — importação limpa não merece
    // um aviso de "tudo certo" ocupando espaço.
    const report: ImportReport | null = data.report ?? null;
    const temAviso = !!report && (
      report.duplicates.length > 0 || report.invalid.length > 0 ||
      report.failed.length > 0 || report.partial.length > 0
    );
    setImportReport(temAviso ? report : null);

    setUrlsText("");
    // Com avisos na tela, fechar o painel esconderia justamente o que a usuária
    // precisa ler.
    if (!temAviso) setShowAddProducts(false);
  }

  async function removeProduct(productId: string) {
    setRemovingId(productId);
    await fetch(`/api/lives/${id}/products/${productId}`, { method: "DELETE" });
    setLive(prev => prev ? { ...prev, products: prev.products.filter(p => p.id !== productId) } : prev);
    setRemovingId(null);
    setConfirmRemoveId(null);
  }

  async function clearAllProducts() {
    if (!live) return;
    setClearingAll(true);
    await Promise.all(live.products.map(p => fetch(`/api/lives/${id}/products/${p.id}`, { method: "DELETE" })));
    setLive(prev => prev ? { ...prev, products: [] } : prev);
    setClearingAll(false);
    setConfirmClearAll(false);
  }

  async function publishVitrine() {
    if (!live) return;
    if (profile?.accountStatus !== "active") {
      setShowActivationModal(true);
      return;
    }
    setTogglingStatus(true);
    const res = await fetch(`/api/lives/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    if (res.ok) {
      setLive(prev => prev ? { ...prev, status: "published" } : prev);
      setShowPublishSuccess(true);
    } else if (res.status === 403) {
      setShowActivationModal(true);
    }
    setTogglingStatus(false);
  }

  async function copyPublicLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function openSizeEdit(product: Product) {
    setEditingSizeId(product.id);
    setSizeInputVal(product.size ?? "");
  }

  async function saveSize(productId: string) {
    const size = sizeInputVal.trim() || null;
    setEditingSizeId(null);
    setLive(prev => prev ? { ...prev, products: prev.products.map(p => p.id === productId ? { ...p, size } : p) } : prev);
    await fetch(`/api/lives/${id}/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size }),
    });
  }

  /** Grava uma ordem e reflete na tela. Mesmo caminho usado pelo arraste. */
  async function persistOrder(ordenados: Product[]) {
    setLive(prev => prev ? { ...prev, products: ordenados } : prev);
    await fetch(`/api/lives/${id}/products/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: ordenados.map(p => p.id) }),
    });
  }

  async function groupByCategory() {
    if (!live) return;
    setGrouping(true);
    const anterior = live.products;
    // `sort` estável: dentro de uma categoria a ordem atual é mantida.
    const agrupados = [...anterior].sort(compareByCategory);
    setOrderBeforeGrouping(anterior);
    await persistOrder(agrupados);
    setGrouping(false);
  }

  async function undoGrouping() {
    if (!orderBeforeGrouping) return;
    setGrouping(true);
    await persistOrder(orderBeforeGrouping);
    setOrderBeforeGrouping(null);
    setGrouping(false);
  }

  function handleDragStart(index: number) { setDragIndex(index); }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); setOverIndex(index); }
  async function handleDrop() {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex || !live) {
      setDragIndex(null); setOverIndex(null); return;
    }
    const reordered = [...live.products];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);
    setLive(prev => prev ? { ...prev, products: reordered } : prev);
    setDragIndex(null); setOverIndex(null);
    // Depois de arrastar à mão, "Desfazer" desapareceria com o ajuste junto —
    // ele voltaria à ordem anterior ao agrupamento, apagando este arraste. O
    // desfazer vale só enquanto nada aconteceu depois do agrupamento.
    setOrderBeforeGrouping(null);
    await fetch(`/api/lives/${id}/products/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map(p => p.id) }),
    });
  }

  // HTML5 drag & drop doesn't fire on touch screens, so the grip handle also
  // drives reordering via touch events: track the finger, highlight the card
  // under it, and drop with the same logic as the mouse path. touch-action is
  // disabled on the handle (touch-none) so the page doesn't scroll instead.
  function handleTouchStart(index: number) { setDragIndex(index); }
  function handleTouchMove(e: React.TouchEvent) {
    if (dragIndex === null) return;
    const touch = e.touches[0];
    const card = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-prod-idx]");
    if (card) setOverIndex(Number((card as HTMLElement).dataset.prodIdx));
    // Auto-scroll the panel when the finger nears the top/bottom edge, so
    // items can be dragged beyond the visible part of a long list.
    const scroller = (e.currentTarget as HTMLElement).closest(".overflow-y-auto");
    if (scroller) {
      const bounds = scroller.getBoundingClientRect();
      if (touch.clientY < bounds.top + 72) scroller.scrollTop -= 10;
      else if (touch.clientY > bounds.bottom - 72) scroller.scrollTop += 10;
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-[var(--cr-background)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[var(--cr-brand-500)] animate-spin" />
      </div>
    );
  }

  if (!live) {
    return (
      <div className="h-full bg-[var(--cr-background)] flex items-center justify-center text-[var(--cr-text-secondary)]">
        Vitrine não encontrada.
      </div>
    );
  }

  const publicUrl = username ? `${typeof window !== "undefined" ? window.location.origin : ""}/${username}/${live.slug}` : null;

  return (
    <div className="h-full flex flex-col bg-[var(--cr-background)] text-[var(--cr-text-primary)] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="h-14 shrink-0 border-b border-[var(--cr-border)] bg-[var(--cr-background)] flex items-center justify-between px-5 z-10">
        <Link href="/app/vitrine" className="flex items-center gap-1.5 text-sm text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Suas vitrines
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={live.status} />
          {live.status === "draft" && (
            <button
              onClick={publishVitrine}
              disabled={togglingStatus}
              className="h-8 px-4 text-xs font-semibold rounded-lg bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {togglingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar"}
            </button>
          )}
          {publicUrl && live.status === "published" && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ── Split body ─────────────────────────────────────────────────────── */}
      <SplitEditorLayout
        editPanelClassName="border-r border-[var(--cr-border)] bg-[var(--cr-background)] p-5 space-y-5"
        editPanel={
        <>

          {/* Vitrine info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cr-surface-soft)] overflow-hidden shrink-0">
              {live.imageUrl ? (
                <img src={live.imageUrl} alt={live.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-[var(--cr-text-tertiary)]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--cr-text-primary)] text-sm truncate">{live.title}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--cr-text-secondary)] mt-0.5 flex-wrap">
                {live.liveDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(live.liveDate + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                )}
                <span>{productCount} produto{productCount !== 1 ? "s" : ""}</span>
                {live.discount && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] text-[10px] font-bold border border-[var(--cr-border)]">
                    -{live.discount}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 h-8 text-xs font-medium text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] bg-[var(--cr-surface-soft)] border border-black/[0.12] hover:border-black/[0.20] rounded-lg transition-colors"
            >
              Editar dados
            </button>
            <button
              onClick={() => setShowAddProducts(v => !v)}
              className={`flex-1 h-8 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                showAddProducts
                  ? "bg-[var(--cr-brand-500)]/20 border-[var(--cr-brand-500)]/40 text-[var(--cr-brand-500)]"
                  : "text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] bg-[var(--cr-surface-soft)] border-black/[0.12] hover:border-black/[0.20]"
              }`}
            >
              <Plus className="w-3 h-3" /> Produtos
            </button>
          </div>

          {/* Add products section */}
          {(showAddProducts || productCount === 0) && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">Adicionar produtos</p>
              <textarea
                value={urlsText}
                onChange={e => setUrlsText(e.target.value)}
                placeholder={"M\nhttps://www.cea.com.br/produto...\n\nNome do produto-G\nhttps://www.cea.com.br/produto..."}
                rows={4}
                disabled={fetching}
                className="w-full bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--cr-brand-500)] resize-none transition-all disabled:opacity-50"
              />
              <p className="text-[10px] text-[var(--cr-text-tertiary)]">{productItems.length} de {slotsLeft} slots disponíveis · o tamanho é lido da linha acima do link, seja ela só o tamanho (&ldquo;M&rdquo;) ou o nome com ele no fim (&ldquo;Nome-M&rdquo;)</p>
              {fetchError && <p className="text-xs text-red-400">{fetchError}</p>}
              {importReport && <ImportReportPanel report={importReport} onDismiss={() => setImportReport(null)} />}
              <div className="flex gap-2">
                <button
                  onClick={fetchProducts}
                  disabled={fetching || productItems.length === 0 || slotsLeft <= 0}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  {fetching ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</> : "Buscar produtos"}
                </button>
                <button onClick={() => setUrlsText("")} disabled={fetching}
                  className="h-9 px-3 text-xs text-[var(--cr-text-secondary)] bg-[var(--cr-surface-soft)] border border-black/[0.12] rounded-xl transition-colors">
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Product list (mini cards) */}
          {live.products.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap px-1">
                <p className="text-[10px] font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">
                  {live.products.length} produto{live.products.length !== 1 ? "s" : ""} · arraste pela alça para reordenar
                </p>
                {/* Numa lista de vinte produtos a borda vermelha some da dobra;
                    a contagem diz que há algo a revisar antes de rolar. */}
                {productsWithIssues > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {productsWithIssues} com problema
                  </span>
                )}

                {/* Diz de antemão quantos vão parar no fim ao agrupar — sem
                    isso a cauda desordenada da lista parece defeito. */}
                {productsWithoutCategory > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--cr-surface-soft)] text-[var(--cr-text-tertiary)] border border-black/[0.08]">
                    {productsWithoutCategory} sem categoria
                  </span>
                )}

                <div className="ml-auto">
                  {orderBeforeGrouping ? (
                    <button
                      onClick={undoGrouping}
                      disabled={grouping}
                      title="Voltar à ordem anterior ao agrupamento"
                      className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg border border-black/[0.12] bg-white text-[var(--cr-text-primary)] hover:border-black/[0.24] disabled:opacity-40 transition-colors"
                    >
                      {grouping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                      Desfazer
                    </button>
                  ) : (
                    <button
                      onClick={groupByCategory}
                      disabled={grouping || live.products.length < 2}
                      title="Reordena a lista juntando os produtos da mesma categoria, em ordem alfabética"
                      className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg border border-black/[0.12] bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] hover:border-black/[0.24] disabled:opacity-40 transition-colors"
                    >
                      {grouping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                      Agrupar por categoria
                    </button>
                  )}
                </div>
              </div>
              {live.products.map((product, i) => {
                const issue = importIssue(product);
                // A borda do card carrega o aviso: some no arraste, porque ali
                // a borda já está sinalizando o alvo do solte.
                const bordaDoAviso = issue?.level === "failed"
                  ? "border-red-300 bg-red-50/40 hover:border-red-400"
                  : "border-amber-300 bg-amber-50/40 hover:border-amber-400";
                return (
                <div
                  key={product.id}
                  data-prod-idx={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  className={`group flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                    overIndex === i && dragIndex !== i
                      ? "border-[var(--cr-brand-500)] bg-[var(--cr-brand-500)]/10"
                      : dragIndex === i
                      ? "border-black/[0.08] bg-white opacity-40"
                      : issue
                      ? bordaDoAviso
                      : "border-black/[0.06] bg-white hover:border-black/[0.12]"
                  }`}
                >
                  <div
                    onTouchStart={() => handleTouchStart(i)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleDrop}
                    onTouchCancel={() => { setDragIndex(null); setOverIndex(null); }}
                    className="w-6 h-9 -my-1 -ml-1.5 flex items-center justify-center shrink-0 touch-none cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-[var(--cr-text-tertiary)] opacity-60 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="w-5 shrink-0 text-right text-[11px] font-semibold text-[var(--cr-text-tertiary)] tabular-nums">
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[var(--cr-surface-soft)] overflow-hidden shrink-0">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[var(--cr-text-tertiary)]" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {shortCat(product.category) && (
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--cr-text-tertiary)] leading-tight truncate">
                        {shortCat(product.category)}
                      </p>
                    )}
                    <p className="text-xs text-[var(--cr-text-primary)] truncate leading-tight">{product.name ? titleCase(product.name) : "Sem nome"}</p>
                    {issue && (
                      <p
                        title={issue.message}
                        className={`flex items-start gap-1 mt-0.5 text-[10px] leading-tight ${
                          issue.level === "failed" ? "text-red-700" : "text-amber-800"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                        <span className="min-w-0">{issue.message}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {product.price && <span className="text-[10px] text-[var(--cr-text-primary)] font-semibold">{product.price}</span>}
                      {(product.clicks ?? 0) > 0 && (
                        <span className="text-[10px] text-[var(--cr-text-tertiary)]">{product.clicks} clique{product.clicks !== 1 ? "s" : ""}</span>
                      )}
                      {/* Inline size field */}
                      {editingSizeId === product.id ? (
                        <input
                          autoFocus
                          value={sizeInputVal}
                          onChange={e => setSizeInputVal(e.target.value)}
                          onBlur={() => saveSize(product.id)}
                          onKeyDown={e => { if (e.key === "Enter") saveSize(product.id); if (e.key === "Escape") setEditingSizeId(null); }}
                          placeholder="ex: M, 38"
                          className="h-4 w-16 bg-transparent border-b border-[var(--cr-brand-500)] text-[10px] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => openSizeEdit(product)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                            product.size
                              ? "border-[var(--cr-brand-500)]/40 text-[var(--cr-brand-500)] bg-[var(--cr-brand-500)]/10 hover:bg-[var(--cr-brand-500)]/20"
                              : "border-black/[0.10] text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] hover:border-black/[0.20]"
                          }`}
                        >
                          {product.size ?? "+ tamanho"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditingProduct(product)} title="Editar produto"
                      className="w-8 h-8 lg:w-6 lg:h-6 rounded-lg bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-text-secondary)] hover:text-white hover:bg-[var(--cr-brand-500)] transition-colors">
                      <Pencil className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                    </button>
                    <button
                      onClick={() => confirmRemoveId === product.id ? removeProduct(product.id) : setConfirmRemoveId(product.id)}
                      disabled={removingId === product.id}
                      title={confirmRemoveId === product.id ? "Toque de novo para remover" : "Remover produto"}
                      className={`w-8 h-8 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center transition-colors ${
                        confirmRemoveId === product.id
                          ? "bg-red-600 text-white"
                          : "bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] hover:text-white hover:bg-red-600"
                      }`}
                    >
                      {removingId === product.id
                        ? <Loader2 className="w-3.5 h-3.5 lg:w-3 lg:h-3 animate-spin" />
                        : confirmRemoveId === product.id
                        ? <Check className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                        : <X className="w-3.5 h-3.5 lg:w-3 lg:h-3" />}
                    </button>
                  </div>
                </div>
                );
              })}

              {/* Clear all */}
              {live.products.length > 0 && (
                <div className="pt-1">
                  {confirmClearAll ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-xs text-red-700 flex-1">Remover todos os {live.products.length} produtos?</p>
                      <button onClick={clearAllProducts} disabled={clearingAll}
                        className="h-7 px-3 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-1">
                        {clearingAll && <Loader2 className="w-3 h-3 animate-spin" />}
                        Confirmar
                      </button>
                      <button onClick={() => setConfirmClearAll(false)}
                        className="h-7 px-3 text-xs bg-black/5 hover:bg-black/10 text-[var(--cr-text-secondary)] rounded-lg">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmClearAll(true)}
                      className="w-full h-8 text-xs text-[var(--cr-text-tertiary)] hover:text-red-400 border border-dashed border-black/[0.08] hover:border-red-600/30 rounded-xl transition-colors">
                      Limpar tudo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
        }
        previewPanel={
          <VitrinePreview live={live} onReorder={async (newProducts) => {
            // Mesma razão do arraste na lista: reordenar à mão invalida o
            // desfazer do agrupamento.
            setOrderBeforeGrouping(null);
            await persistOrder(newProducts);
          }} />
        }
      />

      {/* ── Publish success modal ──────────────────────────────────────────── */}
      <Modal open={!!(showPublishSuccess && publicUrl)} onClose={() => setShowPublishSuccess(false)} maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--cr-text-primary)] text-lg">Vitrine publicada!</h3>
            <p className="text-sm text-[var(--cr-text-secondary)] mt-1">Sua vitrine já está disponível para suas seguidoras.</p>
          </div>
        </div>
        {publicUrl && (
          <div onClick={() => copyPublicLink(publicUrl)}
            className="flex items-center gap-2 bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] hover:border-[var(--cr-brand-600)]/40 rounded-xl px-4 py-3 cursor-pointer group transition-colors mb-5">
            <span className="flex-1 text-xs text-[var(--cr-text-secondary)] truncate">{publicUrl}</span>
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-[var(--cr-text-tertiary)] group-hover:text-[var(--cr-text-primary)] shrink-0 transition-colors" />}
          </div>
        )}
        <div className="flex gap-3">
          <a href={publicUrl ?? "#"} target="_blank" rel="noopener noreferrer"
            className="flex-1 h-10 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-colors">
            Minha vitrine
          </a>
          <button onClick={() => setShowPublishSuccess(false)}
            className="flex-1 h-10 bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] text-sm font-medium rounded-xl hover:border-[var(--cr-brand-300)] transition-colors">
            Fechar
          </button>
        </div>
      </Modal>

      {/* ── Edit vitrine modal ─────────────────────────────────────────────── */}
      {showEditModal && (
        <EditModal live={live} liveId={id} username={username}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => { setLive(prev => prev ? { ...prev, ...updated } : prev); setShowEditModal(false); }}
        />
      )}

      {showActivationModal && (
        <ActivationModal profile={profile} onClose={() => setShowActivationModal(false)} />
      )}

      {/* ── Edit product modal ─────────────────────────────────────────────── */}
      {editingProduct && (
        <EditProductModal product={editingProduct} liveId={id}
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            setLive(prev => prev ? { ...prev, products: prev.products.map(p => p.id === updated.id ? { ...p, ...updated } : p) } : prev);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ── Edit Vitrine Modal ───────────────────────────────────────────────────────

interface EditModalProps {
  live: Live;
  liveId: string;
  username: string | null;
  onClose: () => void;
  onSave: (data: Partial<Live>) => void;
}

function EditModal({ live, liveId, username, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(live.title);
  const [slug, setSlug] = useState(live.slug);
  const [date, setDate] = useState(live.liveDate ?? "");
  const [time, setTime] = useState(live.liveTime?.slice(0, 5) ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(live.imageUrl);
  const [imagePreview, setImagePreview] = useState<string | null>(live.imageUrl);
  const [store, setStore] = useState(live.store ?? "cea");
  const [discount, setDiscount] = useState<string>(live.discount != null ? String(live.discount) : "");
  const [discountType, setDiscountType] = useState<"cart" | "coupon">(live.discountType ?? "cart");
  const [couponCode, setCouponCode] = useState(live.couponCode ?? "");
  const [sectionId, setSectionId] = useState<string | null>(live.sectionId);
  const [showPrices, setShowPrices] = useState(live.showPrices);
  const [showTitle, setShowTitle] = useState(live.showTitle);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/lives/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error); return; }
    setImageUrl(data.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Título obrigatório"); return; }
    setSaving(true);
    const res = await fetch(`/api/lives/${liveId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, slug, liveDate: date || null, liveTime: time || null, imageUrl, store,
        discount: discount.trim() ? Math.min(99, Math.max(1, parseInt(discount))) : null,
        discountType,
        couponCode: discountType === "coupon" ? (couponCode.trim() || null) : null,
        sectionId,
        showPrices,
        showTitle,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSave({ title: data.title, slug: data.slug, liveDate: data.liveDate, liveTime: data.liveTime, imageUrl: data.imageUrl, store: data.store ?? null, discount: data.discount ?? null, discountType: data.discountType ?? "cart", couponCode: data.couponCode ?? null, sectionId: data.sectionId ?? null, showPrices: data.showPrices ?? true, showTitle: data.showTitle ?? true });
  }

  return (
    <Modal open onClose={onClose} title="Editar dados da vitrine" maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
          </div>
          {!date && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Seção</label>
              <SectionSelect value={sectionId} onChange={setSectionId} />
              <p className="text-[11px] text-[var(--cr-text-tertiary)]">Agrupa essa vitrine na galeria pública.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Link da vitrine</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">/{username ?? "..."}/</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl pr-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
                style={{ paddingLeft: `calc(1rem + ${2 + (username?.length ?? 3)}ch)` }}
              />
            </div>
            <p className="text-[11px] text-[var(--cr-text-tertiary)]">Mudar o link não quebra o link antigo — ele redireciona para o novo.</p>
          </div>
          {/* Store + Discount on same row */}
          <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Loja</label>
              <StoreSelect value={store} onChange={setStore} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">
                Desconto <span className="text-[var(--cr-text-tertiary)] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="number" min="1" max="99" value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-3 pr-8 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">%</span>
              </div>
            </div>
          </div>

          {discount.trim() && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Como o desconto é aplicado</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("cart")}
                  className={`h-11 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    discountType === "cart"
                      ? "bg-[var(--cr-brand-500)]/10 border-[var(--cr-brand-500)] text-[var(--cr-brand-500)]"
                      : "bg-[var(--cr-surface-soft)] border-black/[0.12] text-[var(--cr-text-secondary)] hover:border-black/[0.20]"
                  }`}
                >
                  Desconto direto no carrinho
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("coupon")}
                  className={`h-11 px-3 rounded-xl border text-xs font-medium transition-colors ${
                    discountType === "coupon"
                      ? "bg-[var(--cr-brand-500)]/10 border-[var(--cr-brand-500)] text-[var(--cr-brand-500)]"
                      : "bg-[var(--cr-surface-soft)] border-black/[0.12] text-[var(--cr-text-secondary)] hover:border-black/[0.20]"
                  }`}
                >
                  Cupom
                </button>
              </div>
              {discountType === "coupon" && (
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Nome do cupom, ex: ZAFILY10"
                  className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
                />
              )}
            </div>
          )}

          <div className={`w-full flex items-center justify-between px-4 h-11 rounded-xl border bg-white transition-colors ${showPrices ? "border-black/[0.12]" : "border-black/[0.12] opacity-60"}`}>
            <span className="text-sm font-medium text-[var(--cr-text-secondary)]">Mostrar preços</span>
            <button
              type="button"
              onClick={() => setShowPrices(v => !v)}
              title={showPrices ? "Ocultar preços" : "Mostrar preços"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors"
            >
              {showPrices ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className={`w-full flex items-center justify-between px-4 h-11 rounded-xl border bg-white transition-colors ${showTitle ? "border-black/[0.12]" : "border-black/[0.12] opacity-60"}`}>
            <span className="text-sm font-medium text-[var(--cr-text-secondary)]">Mostrar título</span>
            <button
              type="button"
              onClick={() => setShowTitle(v => !v)}
              title={showTitle ? "Ocultar título" : "Mostrar título"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors"
            >
              {showTitle ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Imagem</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              {imagePreview ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-black/[0.12]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Clique para trocar</div>
                </div>
              ) : (
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-black/[0.12] hover:border-[var(--cr-brand-400)] flex flex-col items-center justify-center gap-1 transition-colors">
                  <Upload className="w-5 h-5 text-[var(--cr-text-tertiary)]" />
                  <span className="text-sm text-[var(--cr-text-tertiary)]">Upload de imagem</span>
                  <span className="text-xs font-medium text-[var(--cr-text-secondary)]">2046 × 844 px</span>
                </div>
              )}
            </label>
            <p className="text-xs text-[var(--cr-text-tertiary)]">
              O formato do banner é 2046 × 844 px — outras proporções entram cortadas.
            </p>
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploading}
              className="flex-1 h-10 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar alterações"}
            </button>
            <button type="button" onClick={onClose}
              className="h-10 px-4 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-secondary)] text-sm rounded-xl hover:border-black/[0.20] transition-colors">
              Cancelar
            </button>
          </div>
        </form>
    </Modal>
  );
}

// ── Edit Product Modal ───────────────────────────────────────────────────────

interface EditProductModalProps {
  product: Product;
  liveId: string;
  onClose: () => void;
  onSave: (data: Pick<Product, "id" | "name" | "price" | "category" | "size" | "imageUrl">) => void;
}

function EditProductModal({ product, liveId, onClose, onSave }: EditProductModalProps) {
  const [name, setName] = useState(product.name ?? "");
  const [price, setPrice] = useState(product.price ?? "");
  const [category, setCategory] = useState(shortCat(product.category) ?? "");
  const [size, setSize] = useState(product.size ?? "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/lives/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploadingImage(false);
    if (!res.ok) { setError(data.error ?? "Erro ao enviar imagem"); return; }
    setImageUrl(data.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/lives/${liveId}/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        price: price.trim() || null,
        category: category.trim() || null,
        size: size.trim() || null,
        imageUrl,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSave({ id: product.id, name: data.name, price: data.price, category: data.category ?? null, size: data.size ?? null, imageUrl: data.image_url ?? null });
  }

  return (
    <Modal open onClose={onClose} bodyClassName="">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cr-border)]">
          <h3 className="font-semibold text-[var(--cr-text-primary)]">Editar produto</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-soft)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product image + link */}
        <div className="px-6 py-4 border-b border-[var(--cr-border)] flex items-center gap-3">
          <label className="relative w-14 h-14 rounded-xl bg-[var(--cr-surface-soft)] overflow-hidden shrink-0 cursor-pointer group">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            {imageUrl
              ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[var(--cr-text-tertiary)]" /></div>
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              {uploadingImage
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Upload className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              }
            </div>
          </label>
          <a href={product.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] truncate flex items-center gap-1">
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.url}</span>
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Nome do produto</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Vestido Floral Verão"
              className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Preço</label>
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="R$ 89,90"
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Categoria</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Blusas"
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">
              Tamanho que você usou
              <span className="ml-1.5 text-xs text-[var(--cr-text-tertiary)] font-normal">(ajuda suas seguidoras a escolher)</span>
            </label>
            <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="Ex: M, 38, P/M..."
              className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 h-10 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
            </button>
            <button type="button" onClick={onClose}
              className="h-10 px-4 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-secondary)] text-sm rounded-xl hover:border-black/[0.20] transition-colors">
              Cancelar
            </button>
          </div>
        </form>
    </Modal>
  );
}
