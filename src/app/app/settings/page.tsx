"use client";

import { Topbar } from "@/components/zafily/Topbar";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface Profile {
  username: string;
  instagramHandle: string | null;
  location: string | null;
  followersLabel: string | null;
  reachLabel: string | null;
  viewsLabel: string | null;
  engagementLabel: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  linkUrl: string | null;
  photoUrl: string | null;
  roleTitle: string | null;
}

const emptyProfile: Profile = {
  username: "", instagramHandle: "", location: "", followersLabel: "", reachLabel: "",
  viewsLabel: "", engagementLabel: "", whatsapp: "", contactEmail: "", linkUrl: "", photoUrl: null, roleTitle: "",
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch("/api/profile").then(r => r.json()).then(data => {
      setProfile({
        username: data.username ?? "",
        instagramHandle: data.instagramHandle ?? "",
        location: data.location ?? "",
        followersLabel: data.followersLabel ?? "",
        reachLabel: data.reachLabel ?? "",
        viewsLabel: data.viewsLabel ?? "",
        engagementLabel: data.engagementLabel ?? "",
        whatsapp: data.whatsapp ?? "",
        contactEmail: data.contactEmail ?? "",
        linkUrl: data.linkUrl ?? "",
        photoUrl: data.photoUrl ?? null,
        roleTitle: data.roleTitle ?? "",
      });
      setLoading(false);
    });
  }, []);

  function setField(key: keyof Profile, value: string) {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploadingPhoto(false);
    if (!res.ok) return;
    setField("photoUrl", data.url);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(data.error ?? "Erro ao salvar"); return; }
    setProfile(prev => ({ ...prev, username: data.username ?? prev.username }));
    setSaved(true);
  }

  const email = user?.email ?? "";
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
  const firstName = displayName.split(" ")[0] ?? "";
  const lastName = displayName.split(" ").slice(1).join(" ") ?? "";
  const initial = (firstName || email)?.[0]?.toUpperCase() ?? "?";

  const fieldClass = "w-full h-11 bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.10)] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-[4px] px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all";

  return (
    <>
      <Topbar title="Configurações" description="Gerencie sua conta" />
      <main className="flex-1 overflow-y-auto scrollbar-hidden px-8 py-7">
        <div className="max-w-[720px] mx-auto space-y-6">

          {/* Profile */}
          <section className="bg-white border border-black/[0.08] rounded-[4px] p-6 shadow-[0_16px_48px_rgba(23,23,60,0.10)]">
            <h2 className="font-heading font-semibold text-[var(--cr-text-primary)] mb-5">Perfil</h2>
            <div className="flex items-center gap-5 mb-6">
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--cr-brand-500)] flex items-center justify-center text-xl font-bold text-white shrink-0 relative">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                  {uploadingPhoto && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
                </div>
              </label>
              <div>
                {displayName && <p className="font-medium text-[var(--cr-text-primary)]">{displayName}</p>}
                <p className="text-sm text-[var(--cr-text-tertiary)]">{email}</p>
                <p className="text-xs text-[var(--cr-text-tertiary)] mt-0.5">Clique na foto para {profile.photoUrl ? "trocar" : "enviar"}. Aparece na vitrine e nas propostas públicas.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Primeiro nome", value: firstName },
                { label: "Sobrenome", value: lastName },
                { label: "Email", value: email },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cr-text-secondary)]">{label}</label>
                  <input
                    type="text"
                    defaultValue={value}
                    readOnly
                    className="w-full h-11 bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.08)] text-[var(--cr-text-secondary)] rounded-[4px] px-4 text-sm cursor-default"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Nome de usuário</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--cr-text-tertiary)]">zafily.com.br/</span>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={e => setField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full h-11 bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.10)] text-[var(--cr-text-primary)] rounded-[4px] pl-[104px] pr-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:ring-2 focus:ring-[var(--cr-brand-500)]/20 transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--cr-text-tertiary)] mt-2">
              Usado no link da sua vitrine e das suas propostas comerciais. Mudar o nome de usuário quebra links já compartilhados.
            </p>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white text-sm font-semibold rounded-[4px] transition-colors flex items-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
              </button>
              {saved && !saving && <span className="text-xs text-emerald-600">Salvo.</span>}
              {saveError && <span className="text-xs text-[#E11D48]">{saveError}</span>}
            </div>
          </section>

          {/* Media kit — used on public proposal pages */}
          <section className="bg-white border border-black/[0.08] rounded-[4px] p-6 shadow-[0_16px_48px_rgba(23,23,60,0.10)]">
            <h2 className="font-heading font-semibold text-[var(--cr-text-primary)] mb-1">Dados para propostas</h2>
            <p className="text-xs text-[var(--cr-text-tertiary)] mb-5">Exibidos nas propostas comerciais públicas que você enviar.</p>

            {loading ? (
              <div className="h-32 bg-[rgba(0,0,0,0.03)] rounded-[4px] animate-pulse" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Cargo / título</label>
                  <input type="text" value={profile.roleTitle ?? ""} onChange={e => setField("roleTitle", e.target.value)}
                    placeholder="Criadora de Conteúdo" className={fieldClass} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Instagram</label>
                    <input type="text" value={profile.instagramHandle ?? ""} onChange={e => setField("instagramHandle", e.target.value)}
                      placeholder="@seuusuario" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Localização</label>
                    <input type="text" value={profile.location ?? ""} onChange={e => setField("location", e.target.value)}
                      placeholder="Baixada Santista" className={fieldClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Seguidores</label>
                    <input type="text" value={profile.followersLabel ?? ""} onChange={e => setField("followersLabel", e.target.value)}
                      placeholder="300 mil" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Alcance mensal</label>
                    <input type="text" value={profile.reachLabel ?? ""} onChange={e => setField("reachLabel", e.target.value)}
                      placeholder="+6,5 mi" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Visualizações</label>
                    <input type="text" value={profile.viewsLabel ?? ""} onChange={e => setField("viewsLabel", e.target.value)}
                      placeholder="+12 mi" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Engajamento</label>
                    <input type="text" value={profile.engagementLabel ?? ""} onChange={e => setField("engagementLabel", e.target.value)}
                      placeholder="8%" className={fieldClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">WhatsApp</label>
                    <input type="text" value={profile.whatsapp ?? ""} onChange={e => setField("whatsapp", e.target.value)}
                      placeholder="(13) 99999-9999" className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Email de contato</label>
                    <input type="email" value={profile.contactEmail ?? ""} onChange={e => setField("contactEmail", e.target.value)}
                      placeholder="contato@voce.com.br" className={fieldClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Link (linktree, site, etc.)</label>
                  <input type="text" value={profile.linkUrl ?? ""} onChange={e => setField("linkUrl", e.target.value)}
                    placeholder="linktr.ee/voce" className={fieldClass} />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] disabled:opacity-50 text-white text-sm font-semibold rounded-[4px] transition-colors flex items-center gap-2"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
                  </button>
                  {saved && !saving && <span className="text-xs text-emerald-600">Salvo.</span>}
                </div>
              </div>
            )}
          </section>

          {/* Danger zone */}
          <section className="bg-white border border-[rgba(225,29,72,0.24)] rounded-[4px] p-6">
            <h2 className="font-heading font-semibold text-[#E11D48] mb-1">Zona de perigo</h2>
            <p className="text-xs text-[var(--cr-text-tertiary)] mb-5">Ações irreversíveis. Prossiga com cautela.</p>
            <div className="flex gap-3">
              <button className="h-9 px-4 border border-[rgba(225,29,72,0.32)] text-[#E11D48] text-sm font-medium rounded-[4px] hover:bg-[rgba(225,29,72,0.06)] transition-colors">
                Apagar todos os dados
              </button>
              <button className="h-9 px-4 border border-[rgba(225,29,72,0.32)] text-[#E11D48] text-sm font-medium rounded-[4px] hover:bg-[rgba(225,29,72,0.06)] transition-colors">
                Encerrar conta
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
