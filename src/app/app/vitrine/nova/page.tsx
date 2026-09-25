"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, Eye, EyeOff } from "lucide-react";
import { StoreSelect } from "@/components/zafily/StoreSelect";
import { SectionSelect } from "@/components/zafily/SectionSelect";

export default function NovaLivePage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"vitrine" | "live">("vitrine");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [store, setStore] = useState("cea");
  const [discount, setDiscount] = useState<string>("");
  const [showPrices, setShowPrices] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Título obrigatório"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/lives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        liveDate: type === "live" ? (date || undefined) : undefined,
        liveTime: type === "live" ? (time || undefined) : undefined,
        imageUrl, store,
        sectionId,
        discount: discount.trim() ? Math.min(99, Math.max(1, parseInt(discount))) : null,
        showPrices,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    router.push(`/app/vitrine/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-[var(--cr-background)] text-[var(--cr-text-primary)]">
      <div className="border-b border-[var(--cr-border)] bg-[var(--cr-background)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <Link href="/app/vitrine" className="flex items-center gap-1.5 text-sm text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para suas vitrines
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[var(--cr-text-primary)] mb-1">Nova vitrine</h1>
        <p className="text-[var(--cr-text-secondary)] text-sm mb-8">Salve como rascunho e publique quando estiver pronta.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Título <span className="text-[var(--cr-danger)]">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: C&A Verão 2025"
              required
              className="w-full h-12 bg-white border border-[var(--cr-border-strong)] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-600)] focus:ring-2 focus:ring-[var(--cr-brand-600)]/20 transition-all"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Tipo de vitrine</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("vitrine")}
                className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${
                  type === "vitrine" ? "bg-[var(--cr-brand-600)] border-[var(--cr-brand-600)] text-white" : "bg-white border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:border-[var(--cr-brand-300)]"
                }`}
              >
                Vitrine
              </button>
              <button
                type="button"
                onClick={() => setType("live")}
                className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${
                  type === "live" ? "bg-[var(--cr-brand-600)] border-[var(--cr-brand-600)] text-white" : "bg-white border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:border-[var(--cr-brand-300)]"
                }`}
              >
                Live
              </button>
            </div>
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Seção</label>
            <SectionSelect value={sectionId} onChange={setSectionId} />
            <p className="text-xs text-[var(--cr-text-tertiary)]">Agrupa essa vitrine na galeria pública. Se o tipo for &ldquo;Live&rdquo;, ela entra automaticamente na seção &ldquo;Lives&rdquo;.</p>
          </div>

          {/* Store + Discount */}
          <div className="grid grid-cols-[1fr_120px] gap-4">
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
                  className="w-full h-12 bg-white border border-[var(--cr-border-strong)] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-3 pr-8 text-sm focus:outline-none focus:border-[var(--cr-brand-600)] focus:ring-2 focus:ring-[var(--cr-brand-600)]/20 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">%</span>
              </div>
            </div>
          </div>

          {/* Show prices toggle */}
          <div className={`w-full flex items-center justify-between px-4 h-12 rounded-xl border bg-white transition-colors ${showPrices ? "border-[var(--cr-border-strong)]" : "border-[var(--cr-border-strong)] opacity-60"}`}>
            <div>
              <p className="text-sm font-medium text-[var(--cr-text-primary)]">Mostrar preços</p>
              <p className="text-xs text-[var(--cr-text-tertiary)]">Exibe o preço dos produtos na vitrine pública.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPrices(v => !v)}
              title={showPrices ? "Ocultar preços" : "Mostrar preços"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-hover)] transition-colors"
            >
              {showPrices ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Date + Time (live only) */}
          {type === "live" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Data da vitrine</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-12 bg-white border border-[var(--cr-border-strong)] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-600)] focus:ring-2 focus:ring-[var(--cr-brand-600)]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Horário</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full h-12 bg-white border border-[var(--cr-border-strong)] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-600)] focus:ring-2 focus:ring-[var(--cr-brand-600)]/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Image upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Imagem da vitrine</label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[var(--cr-border-strong)]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                    Clique para trocar
                  </div>
                </div>
              ) : (
                <div className="w-full h-36 rounded-xl border-2 border-dashed border-[var(--cr-border-strong)] hover:border-[var(--cr-brand-400)] flex flex-col items-center justify-center gap-2 transition-colors">
                  <Upload className="w-6 h-6 text-[var(--cr-text-tertiary)]" />
                  <span className="text-sm text-[var(--cr-text-tertiary)]">Clique para fazer upload</span>
                  <span className="text-xs font-medium text-[var(--cr-text-secondary)]">2046 × 844 px</span>
                  <span className="text-xs text-[var(--cr-text-tertiary)]">JPG, PNG ou WebP · máx 5MB</span>
                </div>
              )}
            </label>
            <p className="text-xs text-[var(--cr-text-tertiary)]">
              Escolha uma imagem para representar sua live na vitrine e nos compartilhamentos.
              O formato do banner é 2046 × 844 px — outras proporções entram cortadas.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#fdecec] border border-[#f5c6cb] rounded-xl text-sm text-[var(--cr-danger)]">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 h-11 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : "Criar vitrine"}
            </button>
            <Link
              href="/app/vitrine"
              className="h-11 px-5 bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-medium rounded-xl flex items-center justify-center transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
