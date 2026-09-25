"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Globe, CheckCircle2, FileText, Radio, Layers, X, GripVertical, Share2, Check, Package, ExternalLink, Palette
} from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { VitrineTabs } from "@/components/zafily/VitrineTabs";
import { SocialIcon, SOCIAL_PLATFORMS } from "@/components/zafily/SocialIcons";
import { ActivationModal } from "@/components/zafily/ActivationModal";
import { Modal } from "@/components/zafily/Modal";
import { ThemePickerModal } from "@/components/zafily/ThemePickerModal";
import { PullToRefresh } from "@/components/zafily/PullToRefresh";
import type { DesignSettings } from "@/lib/design-presets";
import type { AccountStatus } from "@/lib/lives-store";

interface Live {
  id: string;
  title: string;
  slug: string;
  liveDate: string | null;
  liveTime: string | null;
  status: "draft" | "published";
  updatedAt: string;
  productCount: number;
  sectionId: string | null;
  imageUrl: string | null;
  discount: number | null;
  position: number;
  thumbnails?: string[];
  clicks?: number;
  views?: number;
}

interface Section {
  id: string;
  name: string;
  position: number;
}

interface SocialLink {
  platform: "instagram" | "pinterest" | "youtube" | "tiktok" | "twitter";
  url: string;
}

interface Profile {
  username: string;
  displayName: string | null;
  photoUrl: string | null;
  bio: string | null;
  socialLinks: SocialLink[];
  designSettings: DesignSettings;
  accountStatus: AccountStatus;
  instagramHandle?: string | null;
}

const FREE_TIER_MAX_LIVES = 2;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}


/**
 * Fileira de seção: cabeçalho com o nome e a contagem, e abaixo uma grade de
 * cards quadrados. Substitui a lista vertical de linhas largas — a grade deixa
 * a vitrine ser reconhecida pela imagem, não pelo texto.
 */
function GroupSection({ title, icon, count, children }: { title: string; icon?: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-semibold text-[var(--cr-text-primary)]">{title}</h2>
        <span className="text-xs text-[var(--cr-text-tertiary)]">({count})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {children}
      </div>
    </section>
  );
}

/**
 * Ação da barra de ferramentas: pill escuro para a ação primária, cinza para as
 * demais.
 *
 * Antes eram cinco círculos rosa idênticos ocupando uma faixa inteira — "Ver
 * página" pesava o mesmo que "Nova vitrine" e a cor da marca era gasta sem
 * hierarquia. Em linha única a barra ocupa ~44px em vez de ~110px, e o rosa
 * fica livre para marcar o que é de fato da marca.
 */
function QuickAction({
  icon, label, href, external, onClick, primary,
}: { icon: React.ReactNode; label: string; href?: string; external?: boolean; onClick?: () => void; primary?: boolean }) {
  const content = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </>
  );

  const cls = `inline-flex items-center gap-2 h-11 px-4 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
    primary
      ? "bg-[var(--surface-dark)] text-white hover:opacity-90"
      : "bg-[var(--surface-secondary)] text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-hover)]"
  }`;

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}


export default function VitrinePage() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [managingSections, setManagingSections] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragLiveId, setDragLiveId] = useState<string | null>(null);
  const [overLiveId, setOverLiveId] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [pickingTheme, setPickingTheme] = useState(false);

  function loadData() {
    return fetch("/api/dashboard").then(r => r.json()).then(d => {
      setLives(Array.isArray(d?.lives) ? d.lives : []);
      setProfile(d?.profile ?? null);
      setSections(Array.isArray(d?.sections) ? d.sections : []);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setLives(Array.isArray(d?.lives) ? d.lives : []);
      setProfile(d?.profile ?? null);
      setSections(Array.isArray(d?.sections) ? d.sections : []);
      setLoading(false);
    });
  }, []);

  function handleNewVitrine() {
    if (profile?.accountStatus !== "active" && lives.length >= FREE_TIER_MAX_LIVES) {
      setShowActivationModal(true);
      return;
    }
    router.push("/app/vitrine/nova");
  }

  async function toggleStatus(live: Live) {
    const next = live.status === "published" ? "draft" : "published";
    if (next === "published" && profile?.accountStatus !== "active") {
      setShowActivationModal(true);
      return;
    }
    const res = await fetch(`/api/lives/${live.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setLives(prev => prev.map(l => l.id === live.id ? { ...l, status: next } : l));
    } else if (res.status === 403) {
      setShowActivationModal(true);
    }
  }

  async function deleteLive(id: string) {
    setDeletingId(id);
    await fetch(`/api/lives/${id}`, { method: "DELETE" });
    setLives(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
    setConfirmId(null);
  }

  async function copyLink(live: Live) {
    if (!profile) return;
    await navigator.clipboard.writeText(`${baseUrl}/${profile.username}/${live.slug}`);
    setCopiedId(live.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function persistLiveOrder(list: Live[]) {
    await fetch("/api/lives/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: list.map(l => l.id) }),
    });
  }

  function handleDropLive() {
    if (dragLiveId === null || overLiveId === null || dragLiveId === overLiveId) {
      setDragLiveId(null); setOverLiveId(null); return;
    }
    setLives(prev => {
      const fromIdx = prev.findIndex(l => l.id === dragLiveId);
      const toIdx = prev.findIndex(l => l.id === overLiveId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      persistLiveOrder(next);
      return next;
    });
    setDragLiveId(null); setOverLiveId(null);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const liveShopping = lives.filter(l => l.liveDate);
  const sectionGroups = sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(section => ({
      section,
      items: lives.filter(l => !l.liveDate && l.sectionId === section.id),
    }));
  const uncategorized = lives.filter(l => !l.liveDate && !l.sectionId);

  function renderCard(live: Live) {
    // Sem "% CTR": uma exibição pode render vários cliques (a vitrine mostra
    // vários produtos), então a razão passa de 100% legitimamente e o rótulo
    // enganava. Dois números concretos dizem mais.
    const impressions = live.views ?? 0;
    const thumbs = (live.thumbnails ?? []).slice(0, 4);
    const dragging = dragLiveId === live.id;
    const over = overLiveId === live.id && !dragging;

    return (
      <div
        key={live.id}
        draggable
        onDragStart={() => setDragLiveId(live.id)}
        onDragOver={e => { e.preventDefault(); setOverLiveId(live.id); }}
        onDrop={handleDropLive}
        onDragEnd={() => { setDragLiveId(null); setOverLiveId(null); }}
        onClick={() => router.push(`/app/vitrine/${live.id}`)}
        className={`group cursor-pointer transition-opacity ${dragging ? "opacity-40" : ""}`}
      >
        {/* Miniatura quadrada — o card é a imagem; nome e dados ficam fora,
            abaixo, como na referência. */}
        <div
          className={`relative aspect-square rounded-[var(--radius-lg)] overflow-hidden transition-shadow ${
            over ? "ring-2 ring-[var(--cr-brand-500)]" : ""
          }`}
          style={{ background: "var(--surface-secondary)" }}
        >
          {thumbs.length > 0 ? (
            <div className={`w-full h-full grid gap-px ${thumbs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {thumbs.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className={`w-full h-full object-cover ${thumbs.length === 3 && i === 0 ? "row-span-2" : ""}`}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-7 h-7" style={{ color: "var(--cr-text-tertiary)" }} />
            </div>
          )}

          {/* Rascunho precisa ser reconhecível na grade sem abrir a vitrine */}
          {live.status !== "published" && (
            <span
              className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(255,255,255,0.92)", color: "var(--cr-text-secondary)" }}
            >
              <FileText className="w-3 h-3" /> Rascunho
            </span>
          )}

          {/* Ações só no hover, para a grade ficar limpa em repouso */}
          <div
            className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            {live.status === "published" && (
              <button
                onClick={() => copyLink(live)}
                title="Copiar link"
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.92)", color: "var(--cr-text-secondary)" }}
              >
                {copiedId === live.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={() => toggleStatus(live)}
              title={live.status === "published" ? "Despublicar" : "Publicar"}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.92)", color: "var(--cr-text-secondary)" }}
            >
              {live.status === "published" ? <Globe className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setConfirmId(live.id)}
              title="Excluir"
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:text-[var(--cr-danger)]"
              style={{ background: "rgba(255,255,255,0.92)", color: "var(--cr-text-secondary)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metadados fora do card */}
        <p className="mt-2.5 text-sm font-medium truncate" style={{ color: "var(--cr-text-primary)" }}>
          {live.title}
        </p>
        <p className="mt-0.5 text-xs truncate" style={{ color: "var(--cr-text-tertiary)" }}>
          {live.productCount ?? 0} produto{live.productCount !== 1 ? "s" : ""}
          {(live.clicks ?? 0) > 0 && ` · ${formatCount(live.clicks!)} clique${live.clicks !== 1 ? "s" : ""}`}
          {impressions > 0 && ` · ${formatCount(impressions)} exibiç${impressions !== 1 ? "ões" : "ão"}`}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--cr-background)] text-[var(--cr-text-primary)] overflow-hidden">
      {/* Sem ações no topo: "Seções" e "Ver página" já estão na barra abaixo,
          junto das demais — repetir aqui só dobrava os mesmos atalhos. */}
      <Topbar title="Minha Vitrine" />

      <VitrineTabs />

      <div className="flex-1 flex overflow-hidden">
        <PullToRefresh onRefresh={loadData} className="flex-1 px-8 py-8">
          {loading ? (
            <div className="space-y-8 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[var(--cr-surface-soft)] shrink-0" />
                <div className="flex-1 min-w-0 pt-1 space-y-2.5">
                  <div className="h-4 w-40 rounded-full bg-[var(--cr-border)]" />
                  <div className="h-3.5 w-56 rounded-full bg-[var(--cr-border)]" />
                </div>
              </div>
              <div className="flex items-start justify-start gap-10 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2 w-20">
                    <div className="w-14 h-14 rounded-full bg-[var(--cr-surface-soft)]" />
                    <div className="h-2.5 w-12 rounded-full bg-[var(--cr-border)]" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 rounded-xl bg-white border border-[var(--cr-border)]" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <ProfileHeader profile={profile} onEdit={() => setEditingProfile(true)} />

              {/* Barra de ações: a primária destacada, as demais agrupadas.
                  Rola no mobile em vez de quebrar em duas linhas. */}
              <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hidden">
                <QuickAction icon={<Plus className="w-4 h-4" />} label="Nova vitrine" onClick={handleNewVitrine} primary />
                <div className="w-px h-6 shrink-0 mx-1" style={{ background: "var(--border-subtle)" }} />
                <QuickAction icon={<Pencil className="w-4 h-4" />} label="Editar dados" onClick={() => setEditingProfile(true)} />
                <QuickAction icon={<ExternalLink className="w-4 h-4" />} label="Ver página" href={profile ? `/${profile.username}` : "#"} external />
                <QuickAction icon={<Layers className="w-4 h-4" />} label="Editar Seções" onClick={() => setManagingSections(true)} />
                <QuickAction icon={<Palette className="w-4 h-4" />} label="Design" onClick={() => setPickingTheme(true)} />
              </div>

              {lives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--cr-brand-600)]/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-[var(--cr-brand-600)]" />
                  </div>
                  <div>
                    <p className="text-[var(--cr-text-primary)] font-semibold text-lg">Nenhuma vitrine ainda</p>
                    <p className="text-[var(--cr-text-secondary)] text-sm mt-1">Crie sua primeira vitrine e comece a compartilhar produtos.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {sectionGroups.filter(g => g.items.length > 0).map(({ section, items }) => (
                    <GroupSection key={section.id} title={section.name} icon={<Layers className="w-4 h-4 text-[var(--cr-brand-600)]" />} count={items.length}>
                      {items.map(renderCard)}
                    </GroupSection>
                  ))}
                  {uncategorized.length > 0 && (
                    <GroupSection title="Sem seção" count={uncategorized.length}>
                      {uncategorized.map(renderCard)}
                    </GroupSection>
                  )}
                  {liveShopping.length > 0 && (
                    <GroupSection title="Lives" icon={<Radio className="w-4 h-4 text-[var(--cr-danger)]" />} count={liveShopping.length}>
                      {liveShopping.map(renderCard)}
                    </GroupSection>
                  )}
                </div>
              )}
            </>
          )}
        </PullToRefresh>
      </div>

      {/* Confirm delete dialog */}
      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} maxWidth="max-w-sm">
        <h3 className="font-semibold text-[var(--cr-text-primary)] mb-2">Excluir vitrine?</h3>
        <p className="text-sm text-[var(--cr-text-secondary)] mb-5">
          Esta ação remove a vitrine e todos os produtos vinculados permanentemente. Não poderá ser desfeito.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => confirmId && deleteLive(confirmId)}
            disabled={deletingId === confirmId}
            className="flex-1 h-10 bg-[var(--cr-danger)] hover:bg-[#b8404b] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {deletingId === confirmId ? "Excluindo..." : "Sim, excluir"}
          </button>
          <button
            onClick={() => setConfirmId(null)}
            className="flex-1 h-10 bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] text-sm font-medium rounded-lg hover:border-[var(--cr-border-strong)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      {pickingTheme && profile && (
        <ThemePickerModal
          current={profile.designSettings?.theme ?? ""}
          photoUrl={profile.photoUrl}
          onClose={() => setPickingTheme(false)}
          onSaved={settings => setProfile(prev => prev ? { ...prev, designSettings: settings } : prev)}
        />
      )}

      {managingSections && (
        <ManageSectionsModal
          sections={sections}
          onClose={() => setManagingSections(false)}
          onChange={setSections}
        />
      )}

      {editingProfile && profile && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setEditingProfile(false)}
          onSaved={setProfile}
        />
      )}

      {showActivationModal && (
        <ActivationModal profile={profile} onClose={() => setShowActivationModal(false)} />
      )}
    </div>
  );
}

// ── Profile header ────────────────────────────────────────────────────────────

function ProfileHeader({ profile, onEdit }: { profile: Profile | null; onEdit: () => void }) {
  const displayName = profile?.displayName || profile?.username || "";
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--cr-surface-soft)] flex items-center justify-center shrink-0">
        {profile?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-[var(--cr-text-tertiary)]">{displayName[0]?.toUpperCase() ?? "?"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h2 className="text-lg font-bold text-[var(--cr-text-primary)] truncate">{displayName}</h2>
        <button
          onClick={onEdit}
          className="text-sm text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-secondary)] transition-colors text-left"
        >
          {profile?.bio || "Adicionar bio"}
        </button>
      </div>
    </div>
  );
}

function ProfileEditModal({ profile, onClose, onSaved }: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [links, setLinks] = useState<SocialLink[]>(profile.socialLinks ?? []);
  const [newPlatform, setNewPlatform] = useState<SocialLink["platform"]>("instagram");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function addLink() {
    const url = newUrl.trim();
    if (!url) return;
    setLinks(prev => [...prev, { platform: newPlatform, url }]);
    setNewUrl("");
  }

  function removeLink(i: number) {
    setLinks(prev => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: bio.trim() || null, socialLinks: links }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSaved({ username: updated.username, displayName: updated.displayName, photoUrl: updated.photoUrl, bio: updated.bio, socialLinks: updated.socialLinks, designSettings: updated.designSettings, accountStatus: updated.accountStatus, instagramHandle: updated.instagramHandle });
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title="Editar perfil">
        <label className="block text-xs font-semibold text-[var(--cr-text-secondary)] mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={2}
          placeholder="Conte um pouco sobre você"
          className="w-full bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--cr-brand-600)] mb-4 resize-none"
        />

        <label className="block text-xs font-semibold text-[var(--cr-text-secondary)] mb-1.5">Redes sociais</label>
        <div className="space-y-2 mb-3">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 border border-[var(--cr-border)] bg-[var(--cr-background)] rounded-xl px-3 py-2">
              <SocialIcon platform={link.platform} className="w-4 h-4 text-[var(--cr-text-secondary)] shrink-0" />
              <span className="flex-1 text-sm text-[var(--cr-text-primary)] truncate">{link.url}</span>
              <button onClick={() => removeLink(i)} className="text-[var(--cr-text-tertiary)] hover:text-[var(--cr-danger)] shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-5">
          <select
            value={newPlatform}
            onChange={e => setNewPlatform(e.target.value as SocialLink["platform"])}
            className="h-10 bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] rounded-xl px-2 text-sm focus:outline-none focus:border-[var(--cr-brand-600)]"
          >
            {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
            placeholder="https://..."
            className="flex-1 h-10 bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] rounded-xl px-3 text-sm focus:outline-none focus:border-[var(--cr-brand-600)]"
          />
          <button type="button" onClick={addLink} className="h-10 px-3 bg-white border border-[var(--cr-border)] hover:border-[var(--cr-border-strong)] text-[var(--cr-text-secondary)] text-sm font-semibold rounded-xl transition-colors shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full h-10 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
    </Modal>
  );
}

// ── Manage sections modal ────────────────────────────────────────────────────

function ManageSectionsModal({ sections, onClose, onChange }: {
  sections: Section[];
  onClose: () => void;
  onChange: (s: Section[]) => void;
}) {
  const [local, setLocal] = useState(sections.slice().sort((a, b) => a.position - b.position));
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  async function create() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/vitrine-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const section = await res.json();
      const next = [...local, section];
      setLocal(next);
      onChange(next);
      setNewName("");
    }
  }

  async function rename(id: string) {
    const name = editingName.trim();
    setEditingId(null);
    if (!name) return;
    const res = await fetch(`/api/vitrine-sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const updated = await res.json();
      const next = local.map(s => s.id === id ? updated : s);
      setLocal(next);
      onChange(next);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/vitrine-sections/${id}`, { method: "DELETE" });
    const next = local.filter(s => s.id !== id);
    setLocal(next);
    onChange(next);
  }

  async function persistOrder(list: Section[]) {
    await fetch("/api/vitrine-sections/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: list.map(s => s.id) }),
    });
  }

  function handleDrop() {
    if (dragId === null || overId === null || dragId === overId) {
      setDragId(null); setOverId(null); return;
    }
    setLocal(prev => {
      const fromIdx = prev.findIndex(s => s.id === dragId);
      const toIdx = prev.findIndex(s => s.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onChange(next);
      persistOrder(next);
      return next;
    });
    setDragId(null); setOverId(null);
  }

  return (
    <Modal open onClose={onClose} title="Seções da galeria">
        <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
          {local.length === 0 && (
            <p className="text-sm text-[var(--cr-text-tertiary)] text-center py-6">Nenhuma seção criada ainda.</p>
          )}
          {local.map(section => (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDragId(section.id)}
              onDragOver={e => { e.preventDefault(); setOverId(section.id); }}
              onDrop={handleDrop}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors ${
                overId === section.id && dragId !== section.id
                  ? "border-[var(--cr-brand-600)] bg-[var(--cr-brand-600)]/5"
                  : dragId === section.id
                    ? "border-[var(--cr-border)] bg-[var(--cr-background)] opacity-40"
                    : "border-[var(--cr-border)] bg-[var(--cr-background)]"
              }`}
            >
              <GripVertical className="w-3.5 h-3.5 text-[var(--cr-text-tertiary)] shrink-0 cursor-grab" />
              {editingId === section.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={() => rename(section.id)}
                  onKeyDown={e => { if (e.key === "Enter") rename(section.id); }}
                  className="flex-1 h-8 bg-white border border-[var(--cr-brand-600)] rounded-lg px-2 text-sm focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-[var(--cr-text-primary)] truncate">{section.name}</span>
              )}
              <button
                type="button"
                onClick={() => { setEditingId(section.id); setEditingName(section.name); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-hover)] shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(section.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--cr-text-tertiary)] hover:text-[var(--cr-danger)] hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); create(); } }}
            placeholder="Nova seção, ex: Calças do momento"
            className="flex-1 h-10 bg-[var(--cr-surface)] border border-[var(--cr-border-strong)] rounded-xl px-3 text-sm focus:outline-none focus:border-[var(--cr-brand-600)]"
          />
          <button type="button" onClick={create} className="h-10 px-4 bg-[var(--cr-brand-600)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-xl transition-colors">
            Criar
          </button>
        </div>
    </Modal>
  );
}
