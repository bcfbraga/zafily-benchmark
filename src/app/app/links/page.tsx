"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Link2, Upload, Loader2, Eye, EyeOff, Square, RectangleHorizontal, RectangleVertical, LayoutGrid,
} from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { Modal } from "@/components/zafily/Modal";

type TileSize = "1x1" | "2x1" | "1x2" | "2x2";

interface LinkTile {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  tileSize: TileSize;
  position: number;
  isActive: boolean;
  clicks?: number;
}

const TILE_SIZES: { value: TileSize; label: string; icon: React.ElementType }[] = [
  { value: "1x1", label: "Ícone", icon: Square },
  { value: "2x1", label: "Texto", icon: RectangleHorizontal },
  { value: "1x2", label: "Vertical", icon: RectangleVertical },
  { value: "2x2", label: "Destaque", icon: LayoutGrid },
];

export default function LinksPage() {
  const [links, setLinks] = useState<LinkTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkTile | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/links")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setLinks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  function handleDrop() {
    if (dragId === null || overId === null || dragId === overId) {
      setDragId(null); setOverId(null); return;
    }
    setLinks(prev => {
      const fromIdx = prev.findIndex(l => l.id === dragId);
      const toIdx = prev.findIndex(l => l.id === overId);
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      fetch("/api/links/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map(l => l.id) }),
      });
      return reordered;
    });
    setDragId(null); setOverId(null);
  }

  async function toggleActive(link: LinkTile) {
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
    await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    setLinks(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Links"
        description="Grid de links soltos na sua página pública"
        action={
          <button
            onClick={() => { setEditingLink(null); setModalOpen(true); }}
            className="h-10 px-4 flex items-center gap-2 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Adicionar link
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="max-w-2xl space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--cr-surface-soft)" }} />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="cr-empty-state">
            <Link2 className="w-7 h-7 mb-3" style={{ color: "var(--cr-text-tertiary)" }} />
            <p className="cr-body-text mb-4">Nenhum link ainda.</p>
            <button
              onClick={() => { setEditingLink(null); setModalOpen(true); }}
              className="h-10 px-4 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Adicione seu primeiro link
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {links.map(link => (
              <div
                key={link.id}
                draggable
                onDragStart={() => setDragId(link.id)}
                onDragOver={e => { e.preventDefault(); setOverId(link.id); }}
                onDrop={handleDrop}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  background: "var(--cr-surface)",
                  borderColor: overId === link.id && dragId !== link.id ? "var(--cr-brand-400)" : "var(--cr-border)",
                  opacity: dragId === link.id ? 0.4 : link.isActive ? 1 : 0.5,
                }}
              >
                <GripVertical className="w-4 h-4 cursor-grab shrink-0" style={{ color: "var(--cr-text-tertiary)" }} />
                {link.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ background: "var(--cr-brand-100)" }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--cr-brand-100)" }}>
                    <Link2 className="w-4 h-4" style={{ color: "var(--cr-brand-600)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--cr-text-primary)" }}>{link.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--cr-text-tertiary)" }}>{link.url}</p>
                </div>
                <span className="text-xs shrink-0 hidden sm:inline" style={{ color: "var(--cr-text-tertiary)" }}>{link.tileSize}</span>
                {typeof link.clicks === "number" && (
                  <span className="text-xs shrink-0 hidden sm:inline" style={{ color: "var(--cr-text-tertiary)" }}>{link.clicks} {link.clicks === 1 ? "clique" : "cliques"}</span>
                )}
                <button
                  onClick={() => toggleActive(link)}
                  title={link.isActive ? "Desativar" : "Ativar"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--cr-text-secondary)" }}
                >
                  {link.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setEditingLink(link); setModalOpen(true); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--cr-text-secondary)" }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmId(link.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--cr-text-secondary)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <LinkFormModal
          link={editingLink}
          onClose={() => setModalOpen(false)}
          onSaved={(saved) => {
            setLinks(prev => editingLink ? prev.map(l => l.id === saved.id ? saved : l) : [...prev, saved]);
            setModalOpen(false);
          }}
        />
      )}

      {confirmId && (
        <Modal open onClose={() => setConfirmId(null)} title="Excluir link">
          <p className="text-sm mb-4" style={{ color: "var(--cr-text-secondary)" }}>Essa ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleDelete(confirmId)}
              disabled={deletingId === confirmId}
              className="flex-1 h-10 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
              style={{ background: "var(--cr-danger)" }}
            >
              {deletingId === confirmId ? "Excluindo..." : "Excluir"}
            </button>
            <button
              onClick={() => setConfirmId(null)}
              className="h-10 px-4 border rounded-xl text-sm transition-colors"
              style={{ borderColor: "var(--cr-border)", color: "var(--cr-text-secondary)" }}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LinkFormModal({ link, onClose, onSaved }: {
  link: LinkTile | null;
  onClose: () => void;
  onSaved: (link: LinkTile) => void;
}) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [tileSize, setTileSize] = useState<TileSize>(link?.tileSize ?? "1x1");
  const [imageUrl, setImageUrl] = useState<string | null>(link?.imageUrl ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(link?.imageUrl ?? null);
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
    const res = await fetch("/api/links/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error); return; }
    setImageUrl(data.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Título obrigatório"); return; }
    if (!url.trim()) { setError("URL obrigatória"); return; }
    setSaving(true);
    const body = { title: title.trim(), url: url.trim(), imageUrl, tileSize };
    const res = link
      ? await fetch(`/api/links/${link.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSaved({ id: data.id, title: data.title, url: data.url, imageUrl: data.imageUrl, tileSize: data.tileSize, position: data.position, isActive: data.isActive, clicks: link?.clicks ?? 0 });
  }

  return (
    <Modal open onClose={onClose} title={link ? "Editar link" : "Adicionar link"} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>Título</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Ex: Meu Instagram"
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all"
            style={{ background: "var(--cr-background)", border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)" }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>URL</label>
          <input
            type="url" value={url} onChange={e => setUrl(e.target.value)} required
            placeholder="https://..."
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all"
            style={{ background: "var(--cr-background)", border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)" }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>Tamanho do tile</label>
          <div className="grid grid-cols-4 gap-2">
            {TILE_SIZES.map(opt => {
              const Icon = opt.icon;
              const active = tileSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTileSize(opt.value)}
                  className="h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{
                    borderColor: active ? "var(--cr-brand-600)" : "var(--cr-border-strong)",
                    background: active ? "var(--cr-brand-50)" : "var(--cr-background)",
                    color: active ? "var(--cr-brand-700)" : "var(--cr-text-tertiary)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>
            Imagem <span style={{ color: "var(--cr-text-tertiary)" }}>(opcional)</span>
          </label>
          <label className="block cursor-pointer">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border" style={{ borderColor: "var(--cr-border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Clique para trocar</div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors" style={{ borderColor: "var(--cr-border-strong)" }}>
                <Upload className="w-5 h-5" style={{ color: "var(--cr-text-tertiary)" }} />
                <span className="text-sm" style={{ color: "var(--cr-text-tertiary)" }}>Upload de imagem</span>
              </div>
            )}
          </label>
        </div>
        {error && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>{error}</div>
        )}
        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={saving || uploading}
            className="flex-1 h-10 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            style={{ background: "var(--cr-brand-600)" }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
          </button>
          <button
            type="button" onClick={onClose}
            className="h-10 px-4 border rounded-xl text-sm transition-colors"
            style={{ borderColor: "var(--cr-border)", color: "var(--cr-text-secondary)" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
