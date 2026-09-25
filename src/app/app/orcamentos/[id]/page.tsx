"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Upload, Package, CheckCircle2, FileText,
  ExternalLink, Copy, Check, Download, Pencil, Eye, EyeOff,
  Minus, Plus, GripVertical, Trash2, PlusCircle
} from "lucide-react";
import { ProposalView, HOURS_ITEM, formatDateBR, type ProposalProfile } from "@/components/zafily/ProposalView";
import { SCOPE_DEFAULT_NOTES } from "@/lib/scope-defaults";
import { CurrencyInput } from "@/components/zafily/CurrencyInput";
import { ActivationModal } from "@/components/zafily/ActivationModal";
import { SplitEditorLayout } from "@/components/zafily/SplitEditorLayout";
import { Modal } from "@/components/zafily/Modal";
import type { AccountStatus } from "@/lib/lives-store";

const SCOPE_PRESETS: { key: string; hint?: string; defaultNotes?: string }[] = [
  { key: "Reels / Feed", defaultNotes: SCOPE_DEFAULT_NOTES["Reels / Feed"] },
  { key: "Sequência de Stories", defaultNotes: SCOPE_DEFAULT_NOTES["Sequência de Stories"] },
  { key: HOURS_ITEM, hint: "quantidade em horas", defaultNotes: SCOPE_DEFAULT_NOTES[HOURS_ITEM] },
  { key: "Roteiro" },
  { key: "Gravação" },
  { key: "Deslocamento" },
  { key: "Direito de Uso de Imagem" },
];

interface Item {
  id: string;
  description: string;
  quantity: number | null;
  notes: string | null;
  position: number;
}

type CreatorProfile = ProposalProfile;

interface Budget {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  clientPhone: string | null;
  clientLogoUrl: string | null;
  finalValue: number | null;
  status: "draft" | "published";
  expiresAt: string | null;
  valueIntro: string | null;
  valuePoints: { title: string; body: string }[] | null;
  valueHidden: boolean;
  conditions: string | null;
  conditionsHidden: boolean;
  updatedAt: string;
  items: Item[];
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] border border-black/[0.12]">
      <FileText className="w-3 h-3" /> Rascunho
    </span>
  );
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Quantity stepper ─────────────────────────────────────────────────────────
function QuantityStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--cr-surface-soft)] border border-black/[0.12] rounded-full p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-6 text-center text-xs font-semibold text-[var(--cr-text-primary)] tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.06] transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Preview (right panel) ────────────────────────────────────────────────────
function BudgetPreview({ budget, profile }: { budget: Budget; profile: CreatorProfile | null }) {
  const fallbackProfile: CreatorProfile = {
    username: "voce", displayName: "Você", instagramHandle: null, location: null,
    followersLabel: null, reachLabel: null, viewsLabel: null, engagementLabel: null,
    whatsapp: null, contactEmail: null, linkUrl: null, photoUrl: null, roleTitle: null,
  };

  return (
    <div className="min-h-full bg-[#efe9e8]">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-xl mx-auto px-5 h-12 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">Preview</span>
          <span className="text-[10px] text-zinc-300">{budget.status === "draft" ? "Rascunho" : "Publicado"}</span>
        </div>
      </div>
      <div className="flex justify-center py-8 px-4">
        <ProposalView budget={budget} profile={profile ?? fallbackProfile} photoSrc={profile?.photoUrl ?? null} />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("draft");
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [customItemText, setCustomItemText] = useState("");
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const creatingRef = useRef<Record<string, boolean>>({});
  const latestQuantityRef = useRef<Record<string, number>>({});
  const pendingDeleteRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/budgets/${id}`).then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([budgetData, profileData]) => {
      setBudget(budgetData);
      setProfile(profileData ?? null);
      setAccountStatus(profileData?.accountStatus ?? "draft");
      setLoading(false);
    });
  }, [id]);

  async function setPresetQuantity(description: string, quantity: number) {
    if (!budget) return;
    const clamped = Math.max(0, quantity);
    const existing = budget.items.find(i => i.description === description && !i.id.startsWith("temp-"));
    const tempItem = budget.items.find(i => i.description === description && i.id.startsWith("temp-"));

    // Already a real item — update (or delete) it directly.
    if (existing) {
      if (clamped <= 0) {
        setBudget(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== existing.id) } : prev);
        await fetch(`/api/budgets/${id}/items/${existing.id}`, { method: "DELETE" });
        return;
      }
      setBudget(prev => prev ? { ...prev, items: prev.items.map(i => i.id === existing.id ? { ...i, quantity: clamped } : i) } : prev);
      await fetch(`/api/budgets/${id}/items/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: clamped }),
      });
      return;
    }

    // A create request for this item is already in flight — just update the
    // optimistic value and let that request pick up the latest number when it resolves.
    if (creatingRef.current[description]) {
      latestQuantityRef.current[description] = clamped;
      pendingDeleteRef.current[description] = clamped <= 0;
      if (tempItem) {
        setBudget(prev => prev ? { ...prev, items: prev.items.map(i => i.id === tempItem.id ? { ...i, quantity: clamped } : i) } : prev);
      }
      return;
    }

    if (clamped <= 0) return;

    // Start a new item, showing it immediately instead of waiting on the network.
    const preset = SCOPE_PRESETS.find(p => p.key === description);
    const tempId = `temp-${description}`;
    creatingRef.current[description] = true;
    latestQuantityRef.current[description] = clamped;
    pendingDeleteRef.current[description] = false;
    setBudget(prev => prev ? {
      ...prev,
      items: [...prev.items, { id: tempId, description, quantity: clamped, notes: preset?.defaultNotes ?? null, position: prev.items.length }],
    } : prev);

    const res = await fetch(`/api/budgets/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, quantity: clamped, notes: preset?.defaultNotes ?? null }),
    });
    const data = await res.json();
    creatingRef.current[description] = false;

    if (!res.ok) {
      setBudget(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== tempId) } : prev);
      return;
    }

    if (pendingDeleteRef.current[description]) {
      pendingDeleteRef.current[description] = false;
      setBudget(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== tempId) } : prev);
      await fetch(`/api/budgets/${id}/items/${data.id}`, { method: "DELETE" });
      return;
    }

    const finalQuantity = latestQuantityRef.current[description] ?? clamped;
    setBudget(prev => prev ? { ...prev, items: prev.items.map(i => i.id === tempId ? { ...data, quantity: finalQuantity } : i) } : prev);
    if (finalQuantity !== data.quantity) {
      await fetch(`/api/budgets/${id}/items/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: finalQuantity }),
      });
    }
  }

  function setPresetNotesLocal(itemId: string, notes: string) {
    setBudget(prev => prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, notes } : i) } : prev);
  }

  async function savePresetNotes(itemId: string, notes: string) {
    await fetch(`/api/budgets/${id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes.trim() || null }),
    });
  }

  async function deleteScopeItem(itemId: string) {
    setBudget(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
    await fetch(`/api/budgets/${id}/items/${itemId}`, { method: "DELETE" });
  }

  function addCustomItem(description: string) {
    const trimmed = description.trim();
    if (!trimmed) return;
    setPresetQuantity(trimmed, 1);
  }

  async function reorderScopeItems(newOrderIds: string[]) {
    setBudget(prev => {
      if (!prev) return prev;
      const byId = new Map(prev.items.map(i => [i.id, i]));
      const reordered = newOrderIds.map((itemId, idx) => ({ ...byId.get(itemId)!, position: idx }));
      const untouched = prev.items.filter(i => !newOrderIds.includes(i.id));
      return { ...prev, items: [...reordered, ...untouched] };
    });
    await fetch(`/api/budgets/${id}/items/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrderIds }),
    });
  }

  function handleScopeDrop(activeItems: Item[], targetId: string) {
    if (!dragItemId || dragItemId === targetId) { setDragItemId(null); return; }
    const ids = activeItems.map(i => i.id);
    const fromIdx = ids.indexOf(dragItemId);
    const toIdx = ids.indexOf(targetId);
    setDragItemId(null);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragItemId);
    reorderScopeItems(reordered);
  }

  async function toggleSectionVisibility(field: "valueHidden" | "conditionsHidden") {
    if (!budget) return;
    const next = !budget[field];
    setBudget(prev => prev ? { ...prev, [field]: next } : prev);
    await fetch(`/api/budgets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
  }


  async function publishBudget() {
    if (!budget) return;
    if (accountStatus !== "active") {
      setShowActivationModal(true);
      return;
    }
    setTogglingStatus(true);
    const res = await fetch(`/api/budgets/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    if (res.ok) {
      setBudget(prev => prev ? { ...prev, status: "published" } : prev);
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

  if (loading) {
    return (
      <div className="h-full bg-[var(--cr-background)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[var(--cr-brand-500)] animate-spin" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="h-full bg-[var(--cr-background)] flex items-center justify-center text-[var(--cr-text-secondary)]">
        Proposta não encontrada.
      </div>
    );
  }

  const publicUrl = profile?.username ? `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.username}/proposta/${budget.slug}` : null;

  const activeScopeItems = [...budget.items].filter(i => (i.quantity ?? 0) > 0).sort((a, b) => a.position - b.position);
  const activeDescriptions = new Set(activeScopeItems.map(i => i.description));
  const inactivePresets = SCOPE_PRESETS.filter(p => !activeDescriptions.has(p.key));

  return (
    <div className="h-full flex flex-col bg-[var(--cr-background)] text-[var(--cr-text-primary)] overflow-hidden">
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-[var(--cr-border)] bg-[var(--cr-background)] flex items-center justify-between px-5 z-10">
        <Link href="/app/orcamentos" className="flex items-center gap-1.5 text-sm text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Suas propostas
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={budget.status} />
          {budget.status === "draft" && (
            <button
              onClick={publishBudget}
              disabled={togglingStatus}
              className="h-8 px-4 text-xs font-semibold rounded-lg bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {togglingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publicar"}
            </button>
          )}
          {publicUrl && budget.status === "published" && (
            <>
              <a href={`/api/budgets/${id}/pdf`} download
                title="Baixar PDF"
                className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> PDF
              </a>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Split body */}
      <SplitEditorLayout
        editPanelClassName="border-r border-[var(--cr-border)] bg-[var(--cr-background)] p-5 space-y-5"
        editPanel={
        <>

          {/* Budget info */}
          <div className="relative rounded-xl border border-black/[0.08] bg-white p-3 space-y-3">
            <button
              onClick={() => setShowEditModal(true)}
              title="Editar dados"
              className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--cr-surface-soft)] overflow-hidden shrink-0 flex items-center justify-center">
                {budget.clientLogoUrl ? (
                  <img src={budget.clientLogoUrl} alt={budget.clientName ?? ""} className="w-full h-full object-contain" />
                ) : (
                  <Package className="w-4 h-4 text-[var(--cr-text-tertiary)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--cr-text-primary)] text-sm truncate">{budget.title}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--cr-text-secondary)] mt-0.5 flex-wrap">
                  {budget.clientName && <span>{budget.clientName}</span>}
                  {budget.finalValue != null && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--cr-brand-500)]/20 text-[var(--cr-brand-500)] text-[10px] font-bold">
                      {formatBRL(budget.finalValue)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-black/[0.06]">
              <div>
                <p className="text-[10px] font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">Valor do investimento</p>
                <p className="text-sm font-semibold text-[var(--cr-text-primary)] mt-0.5">
                  {budget.finalValue != null ? formatBRL(budget.finalValue) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">Validade da proposta</p>
                <p className="text-sm font-semibold text-[var(--cr-text-primary)] mt-0.5">
                  {budget.expiresAt ? formatDateBR(budget.expiresAt) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Scope items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">Escopo</p>
            <p className="text-[10px] text-[var(--cr-text-tertiary)] -mt-1">Arraste para reordenar. A lixeira remove da proposta.</p>

            {activeScopeItems.length > 0 && (
              <div className="space-y-1">
                {activeScopeItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragItemId(item.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleScopeDrop(activeScopeItems, item.id)}
                    className={`px-2.5 py-1.5 rounded-lg border bg-white transition-colors ${dragItemId === item.id ? "border-[var(--cr-brand-500)]/40 opacity-60" : "border-black/[0.06]"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-[var(--cr-text-tertiary)] cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0 leading-tight">
                        <p className="text-xs text-[var(--cr-text-primary)] truncate">{item.description}</p>
                        {item.description === HOURS_ITEM && <p className="text-[10px] text-[var(--cr-text-tertiary)] leading-tight">quantidade em horas</p>}
                      </div>
                      <QuantityStepper value={item.quantity ?? 0} onChange={next => setPresetQuantity(item.description, next)} />
                      <button
                        onClick={() => deleteScopeItem(item.id)}
                        title="Remover"
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[#E11D48] hover:bg-[rgba(225,29,72,0.08)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      defaultValue={item.notes ?? ""}
                      onChange={e => setPresetNotesLocal(item.id, e.target.value)}
                      onBlur={e => savePresetNotes(item.id, e.target.value)}
                      placeholder="Descrição do que será feito (opcional)"
                      className="mt-1 w-full h-6 bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-md px-1.5 text-[11px] focus:outline-none focus:border-[var(--cr-brand-500)] transition-all"
                    />
                  </div>
                ))}
              </div>
            )}

            {inactivePresets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inactivePresets.map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => setPresetQuantity(preset.key, 1)}
                    className="h-7 px-2.5 flex items-center gap-1 rounded-full border border-dashed border-black/[0.15] text-[var(--cr-text-secondary)] hover:border-[var(--cr-brand-500)] hover:text-[var(--cr-brand-500)] text-[11px] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> {preset.key}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customItemText}
                onChange={e => setCustomItemText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomItem(customItemText);
                    setCustomItemText("");
                  }
                }}
                placeholder="Item personalizado..."
                className="flex-1 h-8 bg-white border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-lg px-2.5 text-xs focus:outline-none focus:border-[var(--cr-brand-500)] transition-all"
              />
              <button
                onClick={() => { addCustomItem(customItemText); setCustomItemText(""); }}
                disabled={!customItemText.trim()}
                className="h-8 px-2.5 shrink-0 flex items-center gap-1 rounded-lg bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] disabled:opacity-40 transition-colors text-xs font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Optional content blocks */}
          <div className={`w-full flex items-center justify-between px-3 h-10 rounded-lg border bg-white transition-colors ${budget.valueHidden ? "border-black/[0.08] opacity-50" : "border-black/[0.08]"}`}>
            <span className="text-xs font-semibold text-[var(--cr-text-secondary)] uppercase tracking-wider">Valor Gerado</span>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleSectionVisibility("valueHidden")} title={budget.valueHidden ? "Mostrar na proposta" : "Ocultar da proposta"}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors">
                {budget.valueHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setShowValueModal(true)} title="Editar"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={`w-full flex items-center justify-between px-3 h-10 rounded-lg border bg-white transition-colors ${budget.conditionsHidden ? "border-black/[0.08] opacity-50" : "border-black/[0.08]"}`}>
            <span className="text-xs font-semibold text-[var(--cr-text-secondary)] uppercase tracking-wider">Condições</span>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleSectionVisibility("conditionsHidden")} title={budget.conditionsHidden ? "Mostrar na proposta" : "Ocultar da proposta"}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors">
                {budget.conditionsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setShowConditionsModal(true)} title="Editar"
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-black/[0.04] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
        }
        previewPanel={
          <BudgetPreview budget={budget} profile={profile} />
        }
      />

      {/* Publish success modal */}
      <Modal open={!!(showPublishSuccess && publicUrl)} onClose={() => setShowPublishSuccess(false)} maxWidth="max-w-sm">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--cr-text-primary)] text-lg">Proposta publicada!</h3>
            <p className="text-sm text-[var(--cr-text-secondary)] mt-1">Envie o link abaixo para o seu cliente.</p>
          </div>
        </div>
        {publicUrl && (
          <div onClick={() => copyPublicLink(publicUrl)}
            className="flex items-center gap-2 bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] hover:border-[var(--cr-brand-600)]/40 rounded-xl px-4 py-3 cursor-pointer group transition-colors mb-5">
            <span className="flex-1 text-xs text-[var(--cr-text-secondary)] truncate">{publicUrl}</span>
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-[var(--cr-text-tertiary)] group-hover:text-[var(--cr-text-primary)] shrink-0 transition-colors" />}
          </div>
        )}
        <div className="flex gap-3 mb-3">
          <a href={publicUrl ?? "#"} target="_blank" rel="noopener noreferrer"
            className="flex-1 h-10 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-colors">
            Ver proposta
          </a>
          <a href={`/api/budgets/${id}/pdf`} download
            className="flex-1 h-10 bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar PDF
          </a>
        </div>
        <button onClick={() => setShowPublishSuccess(false)}
          className="w-full h-10 bg-[var(--cr-surface-soft)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] text-sm font-medium rounded-xl hover:border-[var(--cr-brand-300)] transition-colors">
          Fechar
        </button>
      </Modal>

      {/* Edit budget modal */}
      {showEditModal && (
        <EditModal budget={budget} budgetId={id}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => { setBudget(prev => prev ? { ...prev, ...updated } : prev); setShowEditModal(false); }}
        />
      )}

      {showActivationModal && (
        <ActivationModal profile={profile} onClose={() => setShowActivationModal(false)} />
      )}

      {/* Value Gerado modal */}
      {showValueModal && (
        <ValueModal budget={budget} budgetId={id}
          onClose={() => setShowValueModal(false)}
          onSave={(updated) => { setBudget(prev => prev ? { ...prev, ...updated } : prev); setShowValueModal(false); }}
        />
      )}

      {/* Conditions modal */}
      {showConditionsModal && (
        <ConditionsModal budget={budget} budgetId={id}
          onClose={() => setShowConditionsModal(false)}
          onSave={(updated) => { setBudget(prev => prev ? { ...prev, ...updated } : prev); setShowConditionsModal(false); }}
        />
      )}

    </div>
  );
}

// ── Edit Budget Modal ────────────────────────────────────────────────────────

interface EditModalProps {
  budget: Budget;
  budgetId: string;
  onClose: () => void;
  onSave: (data: Partial<Budget>) => void;
}

function EditModal({ budget, budgetId, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(budget.title);
  const [clientName, setClientName] = useState(budget.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(budget.clientPhone ?? "");
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(budget.clientLogoUrl);
  const [logoPreview, setLogoPreview] = useState<string | null>(budget.clientLogoUrl);
  const [finalValue, setFinalValue] = useState<number | null>(budget.finalValue);
  const [expiresAt, setExpiresAt] = useState(budget.expiresAt ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/budgets/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error); return; }
    setClientLogoUrl(data.url);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Título obrigatório"); return; }
    setSaving(true);
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        clientName: clientName || null,
        clientPhone: clientPhone || null,
        clientLogoUrl,
        finalValue,
        expiresAt: expiresAt || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSave({
      title: data.title,
      clientName: data.clientName ?? null,
      clientPhone: data.clientPhone ?? null,
      clientLogoUrl: data.clientLogoUrl ?? null,
      finalValue: data.finalValue ?? null,
      expiresAt: data.expiresAt ?? null,
    });
  }

  return (
    <Modal open onClose={onClose} title="Editar dados da proposta" maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Título interno</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Nome do cliente</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Telefone</label>
              <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Valor do investimento</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">R$</span>
                <CurrencyInput
                  defaultValue={budget.finalValue}
                  onChange={setFinalValue}
                  className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl pl-9 pr-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Validade da proposta</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full h-11 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-primary)] rounded-xl px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Logo do cliente</label>
            <label className="block cursor-pointer">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
              {logoPreview ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-black/[0.12] bg-white flex items-center justify-center">
                  <img src={logoPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">Clique para trocar</div>
                </div>
              ) : (
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-black/[0.12] hover:border-violet-500 flex items-center justify-center gap-2 transition-colors">
                  <Upload className="w-5 h-5 text-[var(--cr-text-tertiary)]" />
                  <span className="text-sm text-[var(--cr-text-tertiary)]">Upload de logo</span>
                </div>
              )}
            </label>
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

// ── Value Gerado Modal ──────────────────────────────────────────────────────

interface ValueModalProps {
  budget: Budget;
  budgetId: string;
  onClose: () => void;
  onSave: (data: Partial<Budget>) => void;
}

function ValueModal({ budget, budgetId, onClose, onSave }: ValueModalProps) {
  const [valueIntro, setValueIntro] = useState(budget.valueIntro ?? "");
  const [points, setPoints] = useState(
    [0, 1, 2].map(i => ({ title: budget.valuePoints?.[i]?.title ?? "", body: budget.valuePoints?.[i]?.body ?? "" }))
  );
  const [saving, setSaving] = useState(false);

  function updatePoint(index: number, field: "title" | "body", value: string) {
    setPoints(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const cleaned = points.map(p => ({ title: p.title.trim(), body: p.body.trim() }));
    const hasContent = cleaned.some(p => p.title || p.body);
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valueIntro: valueIntro.trim() || null,
        valuePoints: hasContent ? cleaned : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    onSave({ valueIntro: data.valueIntro ?? null, valuePoints: data.valuePoints ?? null });
  }

  return (
    <Modal open onClose={onClose} title="Valor Gerado" maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Introdução <span className="text-[var(--cr-text-tertiary)] font-normal">(opcional)</span></label>
            <textarea
              value={valueIntro} onChange={e => setValueIntro(e.target.value)}
              placeholder="Introdução da seção"
              rows={2}
              className="w-full bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all resize-none"
            />
          </div>
          {points.map((p, i) => (
            <div key={i} className="p-3 rounded-xl border border-black/[0.08] bg-[var(--cr-surface-soft)] space-y-2">
              <input
                type="text" value={p.title} onChange={e => updatePoint(i, "title", e.target.value)}
                placeholder={`Título do ponto ${i + 1}`}
                className="w-full h-9 bg-white border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-lg px-3 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all"
              />
              <textarea
                value={p.body} onChange={e => updatePoint(i, "body", e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full bg-white border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all resize-none"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 h-10 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
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

// ── Conditions Modal ─────────────────────────────────────────────────────────

interface ConditionsModalProps {
  budget: Budget;
  budgetId: string;
  onClose: () => void;
  onSave: (data: Partial<Budget>) => void;
}

function ConditionsModal({ budget, budgetId, onClose, onSave }: ConditionsModalProps) {
  const [conditions, setConditions] = useState(budget.conditions ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/budgets/${budgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: conditions.trim() || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    onSave({ conditions: data.conditions ?? null });
  }

  return (
    <Modal open onClose={onClose} title="Condições" maxWidth="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--cr-text-secondary)]">Uma condição por linha</label>
            <textarea
              value={conditions} onChange={e => setConditions(e.target.value)}
              placeholder={"Prazo de produção definido após aprovação do briefing\nInclui 1 rodada de ajustes antes da publicação"}
              rows={6}
              className="w-full bg-[var(--cr-surface-soft)] border border-black/[0.08] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 h-10 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
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
