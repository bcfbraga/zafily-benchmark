"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { Topbar } from "@/components/zafily/Topbar";
import { VitrineTabs } from "@/components/zafily/VitrineTabs";
import { VitrinePreviewFrame, type PreviewLive, type PreviewSection } from "@/components/zafily/VitrinePreviewFrame";
import { Modal } from "@/components/zafily/Modal";
import { THEME_PRESETS, type DesignSettings } from "@/lib/design-presets";

interface Profile {
  username: string;
  displayName: string | null;
  photoUrl: string | null;
  designSettings: DesignSettings;
}

const FIELD_OPTIONS = {
  header: ["Classic", "Minimal", "Bold"],
  wallpaper: ["Solid", "Gradient", "Foto"],
  buttons: ["Solid", "Outline", "Glass"],
  text: ["Poppins, Link Sans", "Inter, System", "Playfair, Inter"],
  colors: ["Linho", "Marsala", "Preto & Branco", "Dourado"],
} as const;

type Field = keyof typeof FIELD_OPTIONS;

function computeThemeName(s: Omit<DesignSettings, "theme">): string {
  for (const [name, preset] of Object.entries(THEME_PRESETS)) {
    const b = preset.settings;
    if (b.header === s.header && b.wallpaper === s.wallpaper && b.buttons === s.buttons && b.text === s.text && b.colors === s.colors) {
      return name;
    }
  }
  return "Custom";
}

function ValueTag({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-[var(--cr-text-tertiary)]">
      {value}
    </span>
  );
}

function Row({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white border border-black/[0.06] rounded-2xl px-4 py-3.5 hover:border-black/[0.12] hover:bg-[var(--cr-background)] transition-colors"
    >
      {icon}
      <span className="flex-1 text-left text-sm font-medium text-[var(--cr-text-primary)]">{label}</span>
      {value && <ValueTag value={value} />}
      <ChevronRight className="w-4 h-4 text-[var(--cr-text-tertiary)] shrink-0" />
    </button>
  );
}

function ThemeSwatch({ background }: { background: string }) {
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
      style={{ background }}
    >
      Aa
    </div>
  );
}

function HeaderSwatch({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--cr-surface-soft)] flex items-center justify-center shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[var(--cr-text-tertiary)] text-xs font-bold">Aa</span>
      )}
    </div>
  );
}

function WallpaperSwatch() {
  return (
    <div
      className="w-11 h-11 rounded-xl shrink-0"
      style={{ background: "radial-gradient(circle at 30% 30%, #E3BEC7, #2B1B33)" }}
    />
  );
}

function ButtonsSwatch() {
  return (
    <div className="w-11 h-11 rounded-xl bg-[var(--cr-surface-soft)] flex items-center justify-center shrink-0">
      <div className="w-6 h-6 rounded-full bg-white shadow" />
    </div>
  );
}

function TextSwatch() {
  return (
    <div className="w-11 h-11 rounded-xl bg-[var(--cr-surface-soft)] flex items-center justify-center text-[var(--cr-text-primary)] font-semibold shrink-0">
      Aa
    </div>
  );
}

function ColorsSwatch() {
  return (
    <div className="w-11 h-11 rounded-xl overflow-hidden flex shrink-0">
      <div className="w-1/2 h-full bg-[#2B1B33]" />
      <div className="w-1/2 h-full bg-[#E3BEC7]" />
    </div>
  );
}

export default function DesignPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lives, setLives] = useState<PreviewLive[]>([]);
  const [sections, setSections] = useState<PreviewSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<"theme" | Field | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setProfile(d?.profile ?? null);
      setLives(Array.isArray(d?.lives) ? d.lives : []);
      setSections(Array.isArray(d?.sections) ? d.sections : []);
    });
  }, []);

  async function save(next: DesignSettings) {
    setProfile(prev => prev ? { ...prev, designSettings: next } : prev);
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designSettings: next }),
    });
    setSaving(false);
  }

  function applyTheme(name: string) {
    if (!profile) return;
    save({ ...THEME_PRESETS[name].settings, theme: name });
    setPicker(null);
  }

  function applyField(field: Field, value: string) {
    if (!profile) return;
    const next = { ...profile.designSettings, [field]: value };
    next.theme = computeThemeName(next);
    save(next);
    setPicker(null);
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col bg-[var(--cr-background)]">
        <Topbar title="Design" />
        <VitrineTabs />
      </div>
    );
  }

  const s = profile.designSettings;

  return (
    <div className="h-full flex flex-col bg-[var(--cr-background)] text-[var(--cr-text-primary)] overflow-hidden">
      <Topbar title="Design" />
      <VitrineTabs />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-xl mx-auto space-y-6">
            <Row
              icon={<ThemeSwatch background={THEME_PRESETS[s.theme]?.background ?? "linear-gradient(160deg, var(--cr-brand-500) 0%, #8C2F45 100%)"} />}
              label="Theme"
              value={s.theme}
              onClick={() => setPicker("theme")}
            />

            <div>
              <h2 className="text-sm font-semibold text-[var(--cr-text-secondary)] mb-3">Customize</h2>
              <div className="space-y-2">
                <Row icon={<HeaderSwatch photoUrl={profile.photoUrl} />} label="Header" value={s.header} onClick={() => setPicker("header")} />
                <Row icon={<WallpaperSwatch />} label="Wallpaper" value={s.wallpaper} onClick={() => setPicker("wallpaper")} />
                <Row icon={<ButtonsSwatch />} label="Buttons" value={s.buttons} onClick={() => setPicker("buttons")} />
                <Row icon={<TextSwatch />} label="Text" value={s.text} onClick={() => setPicker("text")} />
                <Row icon={<ColorsSwatch />} label="Colors" onClick={() => setPicker("colors")} />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-[360px] shrink-0 border-l border-black/[0.08] items-center justify-center p-6 bg-[var(--cr-background)] overflow-y-auto">
          <VitrinePreviewFrame profile={profile} sections={sections} lives={lives} />
        </div>
      </div>

      {picker === "theme" && (
        <ThemeGridModal
          current={s.theme}
          photoUrl={profile.photoUrl}
          onSelect={applyTheme}
          onClose={() => setPicker(null)}
        />
      )}
      {picker && picker !== "theme" && (
        <PickerModal
          title={picker.charAt(0).toUpperCase() + picker.slice(1)}
          options={[...FIELD_OPTIONS[picker]]}
          current={s[picker]}
          onSelect={v => applyField(picker, v)}
          onClose={() => setPicker(null)}
        />
      )}

      {saving && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-[var(--cr-text-primary)] text-white text-xs font-semibold rounded-full shadow-lg">
          Salvando...
        </div>
      )}
    </div>
  );
}

function ThemeGridModal({ current, photoUrl, onSelect, onClose }: {
  current: string;
  photoUrl: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Theme" maxWidth="max-w-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(THEME_PRESETS).map(([name, preset]) => {
            const selected = name === current;
            return (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-colors ${selected ? "border-[var(--cr-brand-500)]" : "border-transparent hover:border-black/[0.12]"}`}
              >
                <div className="aspect-[3/4] flex flex-col items-center pt-4 px-3 gap-1.5" style={{ background: preset.background }}>
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white/25 flex items-center justify-center shrink-0">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold" style={{ color: preset.textColor }}>Aa</span>
                    )}
                  </div>
                  <div className="w-full mt-1 space-y-1.5">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="w-full h-4 rounded-full"
                        style={{ background: preset.buttonBg, border: preset.buttonBorder ? `1px solid ${preset.buttonBorder}` : undefined }}
                      />
                    ))}
                  </div>
                </div>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--cr-brand-500)] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="py-2 text-center text-xs font-semibold text-[var(--cr-text-primary)] bg-white">{name}</div>
              </button>
            );
          })}
        </div>
    </Modal>
  );
}

function PickerModal({ title, options, current, onSelect, onClose }: {
  title: string;
  options: string[];
  current: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={title} maxWidth="max-w-sm">
        <div className="space-y-1.5">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                opt === current ? "bg-[var(--cr-brand-500)]/10 text-[var(--cr-brand-500)]" : "text-[var(--cr-text-primary)] hover:bg-[var(--cr-background)]"
              }`}
            >
              {opt}
              {opt === current && <span className="w-2 h-2 rounded-full bg-[var(--cr-brand-500)]" />}
            </button>
          ))}
        </div>
    </Modal>
  );
}
