"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Ticket, Loader2, Eye, EyeOff } from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { Modal } from "@/components/zafily/Modal";

interface Coupon {
  id: string;
  storeName: string;
  category: string | null;
  discountLabel: string;
  code: string | null;
  url: string;
  position: number;
  isActive: boolean;
}

const fieldStyle = {
  background: "var(--cr-background)",
  border: "1px solid var(--cr-border-strong)",
  color: "var(--cr-text-primary)",
} as const;

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coupons")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setCoupons(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  function handleDrop() {
    if (dragId === null || overId === null || dragId === overId) {
      setDragId(null); setOverId(null); return;
    }
    setCoupons(prev => {
      const fromIdx = prev.findIndex(c => c.id === dragId);
      const toIdx = prev.findIndex(c => c.id === overId);
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      fetch("/api/coupons/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map(c => c.id) }),
      });
      return reordered;
    });
    setDragId(null); setOverId(null);
  }

  async function toggleActive(coupon: Coupon) {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
    await fetch(`/api/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Cupons"
        description="Cupons e ofertas exibidos na sua página pública"
        action={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="h-10 px-4 flex items-center gap-2 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Adicionar cupom
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
        ) : coupons.length === 0 ? (
          <div className="cr-empty-state">
            <Ticket className="w-7 h-7 mb-3" style={{ color: "var(--cr-text-tertiary)" }} />
            <p className="cr-body-text mb-4">Nenhum cupom ainda.</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="h-10 px-4 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Adicione seu primeiro cupom
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {coupons.map(coupon => (
              <div
                key={coupon.id}
                draggable
                onDragStart={() => setDragId(coupon.id)}
                onDragOver={e => { e.preventDefault(); setOverId(coupon.id); }}
                onDrop={handleDrop}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  background: "var(--cr-surface)",
                  borderColor: overId === coupon.id && dragId !== coupon.id ? "var(--cr-brand-400)" : "var(--cr-border)",
                  opacity: dragId === coupon.id ? 0.4 : coupon.isActive ? 1 : 0.5,
                }}
              >
                <GripVertical className="w-4 h-4 cursor-grab shrink-0" style={{ color: "var(--cr-text-tertiary)" }} />
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--cr-surface-soft)" }}>
                  <Ticket className="w-4 h-4" style={{ color: "var(--cr-text-secondary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--cr-text-primary)" }}>
                    {coupon.storeName}
                    {coupon.category && (
                      <span className="font-normal" style={{ color: "var(--cr-text-tertiary)" }}> · {coupon.category}</span>
                    )}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--cr-text-tertiary)" }}>
                    {coupon.discountLabel}
                    {coupon.code && ` · ${coupon.code}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(coupon)}
                  title={coupon.isActive ? "Desativar" : "Ativar"}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--cr-text-secondary)" }}
                >
                  {coupon.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setEditing(coupon); setModalOpen(true); }}
                  title="Editar"
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--cr-text-secondary)" }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmId(coupon.id)}
                  title="Excluir"
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
        <CouponFormModal
          coupon={editing}
          onClose={() => setModalOpen(false)}
          onSaved={saved => {
            setCoupons(prev => editing ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved]);
            setModalOpen(false);
          }}
        />
      )}

      {confirmId && (
        <Modal open onClose={() => setConfirmId(null)} title="Excluir cupom">
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

function CouponFormModal({ coupon, onClose, onSaved }: {
  coupon: Coupon | null;
  onClose: () => void;
  onSaved: (coupon: Coupon) => void;
}) {
  const [storeName, setStoreName] = useState(coupon?.storeName ?? "");
  const [category, setCategory] = useState(coupon?.category ?? "");
  const [discountLabel, setDiscountLabel] = useState(coupon?.discountLabel ?? "");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [url, setUrl] = useState(coupon?.url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName.trim()) { setError("Informe a loja"); return; }
    if (!discountLabel.trim()) { setError("Informe o desconto"); return; }
    if (!url.trim()) { setError("Informe o link da loja"); return; }
    setSaving(true);
    const body = {
      storeName: storeName.trim(),
      category: category.trim(),
      discountLabel: discountLabel.trim(),
      code: code.trim(),
      url: url.trim(),
    };
    const res = coupon
      ? await fetch(`/api/coupons/${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSaved(data);
  }

  return (
    <Modal open onClose={onClose} title={coupon ? "Editar cupom" : "Adicionar cupom"} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>Loja</label>
          <input
            type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required
            placeholder="Ex: Sallve"
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all" style={fieldStyle}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>
            Categoria <span style={{ color: "var(--cr-text-tertiary)" }}>(opcional)</span>
          </label>
          <input
            type="text" value={category} onChange={e => setCategory(e.target.value)}
            placeholder="Ex: Skincare"
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all" style={fieldStyle}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>Desconto</label>
          <input
            type="text" value={discountLabel} onChange={e => setDiscountLabel(e.target.value)} required
            placeholder="Ex: 20% OFF ou R$30 OFF acima de R$150"
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all" style={fieldStyle}
          />
          <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
            Texto livre — aparece como está na sua página.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>
            Código <span style={{ color: "var(--cr-text-tertiary)" }}>(opcional)</span>
          </label>
          <input
            type="text" value={code} onChange={e => setCode(e.target.value)}
            placeholder="Ex: PAM20"
            className="w-full h-11 rounded-xl px-4 text-sm font-mono focus:outline-none transition-all" style={fieldStyle}
          />
          <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
            Sem código, o cupom mostra só o botão &ldquo;Ver loja&rdquo;.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--cr-text-secondary)" }}>Link da loja</label>
          <input
            type="url" value={url} onChange={e => setUrl(e.target.value)} required
            placeholder="https://..."
            className="w-full h-11 rounded-xl px-4 text-sm focus:outline-none transition-all" style={fieldStyle}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "#fdeceb", border: "1px solid #f3c9c9", color: "var(--cr-danger)" }}>{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={saving}
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
