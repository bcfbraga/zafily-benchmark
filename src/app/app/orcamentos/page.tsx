"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, Receipt, CheckCircle2, FileText, ExternalLink
} from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { Modal } from "@/components/zafily/Modal";

interface Budget {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  finalValue: number | null;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

interface Profile {
  username: string;
  displayName: string | null;
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--cr-surface-soft)] text-[var(--cr-text-secondary)] border border-black/[0.12]">
      <FileText className="w-3 h-3" /> Rascunho
    </span>
  );
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OrcamentosPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/budgets").then(r => r.json()),
      fetch("/api/profile").then(r => r.json()),
    ]).then(([budgetsData, profileData]) => {
      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      setProfile(profileData);
      setLoading(false);
    });
  }, []);

  async function deleteBudget(id: string) {
    setDeletingId(id);
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setBudgets(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-[var(--cr-background)] text-[var(--cr-text-primary)]">
      <Topbar title="Propostas comerciais" action={
        <Link
          href="/app/orcamentos/novo"
          className="flex items-center gap-1.5 h-8 px-4 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nova proposta
        </Link>
      } />

      <div className="px-8 py-8">
        {/* Budgets list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-white border border-black/[0.08] animate-pulse" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--cr-brand-500)]/20 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-[var(--cr-brand-500)]" />
            </div>
            <div>
              <p className="text-[var(--cr-text-primary)] font-semibold text-lg">Nenhuma proposta ainda</p>
              <p className="text-[var(--cr-text-secondary)] text-sm mt-1">Crie sua primeira proposta e envie o link para o cliente.</p>
            </div>
            <Link
              href="/app/orcamentos/novo"
              className="flex items-center gap-1.5 h-10 px-5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Criar primeira proposta
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-black/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white text-left text-[11px] font-semibold text-[var(--cr-text-tertiary)] uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Proposta</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Criado em</th>
                  <th className="px-5 py-3 font-semibold">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(budget => (
                  <tr
                    key={budget.id}
                    onClick={() => router.push(`/app/orcamentos/${budget.id}`)}
                    className="border-t border-black/[0.06] hover:bg-white cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 min-w-0">
                      <p className="font-medium text-[var(--cr-text-primary)] truncate">{budget.title}</p>
                      {budget.status === "published" && profile && (
                        <a
                          href={`${baseUrl}/${profile.username}/proposta/${budget.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] mt-0.5 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {`/${profile.username}/proposta/${budget.slug}`}
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[var(--cr-text-secondary)]">{budget.clientName || "—"}</td>
                    <td className="px-5 py-4 text-[var(--cr-text-secondary)] whitespace-nowrap">
                      {new Date(budget.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {budget.finalValue != null ? (
                        <span className="font-semibold text-[var(--cr-brand-500)]">{formatBRL(budget.finalValue)}</span>
                      ) : (
                        <span className="text-[var(--cr-text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={budget.status} />
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmId(budget.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} maxWidth="max-w-sm">
        <h3 className="font-semibold text-[var(--cr-text-primary)] mb-2">Excluir proposta?</h3>
        <p className="text-sm text-[var(--cr-text-secondary)] mb-5">
          Esta ação remove a proposta e todos os itens vinculados permanentemente. Não poderá ser desfeito.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => confirmId && deleteBudget(confirmId)}
            disabled={deletingId === confirmId}
            className="flex-1 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {deletingId === confirmId ? "Excluindo..." : "Sim, excluir"}
          </button>
          <button
            onClick={() => setConfirmId(null)}
            className="flex-1 h-10 bg-[var(--cr-surface-soft)] border border-black/[0.12] text-[var(--cr-text-secondary)] text-sm font-medium rounded-lg hover:border-black/[0.20] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
