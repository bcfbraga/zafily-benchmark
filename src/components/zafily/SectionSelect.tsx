"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Plus, Layers } from "lucide-react";

interface Section {
  id: string;
  name: string;
}

interface SectionSelectProps {
  value: string | null;
  onChange: (v: string | null) => void;
}

export function SectionSelect({ value, onChange }: SectionSelectProps) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/vitrine-sections")
      .then(r => r.json())
      .then(data => { setSections(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setCreating(false); }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = sections.find(s => s.id === value) ?? null;

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/vitrine-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const section = await res.json();
      setSections(prev => [...prev, section]);
      onChange(section.id);
      setNewName("");
      setCreating(false);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-11 bg-[var(--cr-surface-soft)] border ${open ? "border-[var(--cr-brand-500)] ring-2 ring-[var(--cr-brand-500)]/20" : "border-black/[0.12] hover:border-black/[0.20]"} text-[var(--cr-text-primary)] rounded-xl px-4 text-sm transition-all flex items-center gap-2 cursor-pointer`}
      >
        <Layers className="w-4 h-4 text-[var(--cr-text-tertiary)] shrink-0" />
        <span className="flex-1 text-left font-medium truncate">{selected ? selected.name : "Sem seção"}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--cr-text-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white border border-black/[0.12] rounded-xl shadow-[0_16px_48px_rgba(23,23,60,0.14)] overflow-hidden py-1 max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              !value ? "bg-[var(--cr-brand-500)]/10 text-[var(--cr-brand-700)]" : "text-[var(--cr-text-secondary)] hover:bg-black/[0.04] hover:text-[var(--cr-text-primary)]"
            }`}
          >
            <span className="flex-1 text-left font-medium">Sem seção</span>
            {!value && <Check className="w-4 h-4 text-[var(--cr-brand-500)]" />}
          </button>

          {!loading && sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => { onChange(section.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                section.id === value ? "bg-[var(--cr-brand-500)]/10 text-[var(--cr-brand-700)]" : "text-[var(--cr-text-secondary)] hover:bg-black/[0.04] hover:text-[var(--cr-text-primary)]"
              }`}
            >
              <span className="flex-1 text-left font-medium truncate">{section.name}</span>
              {section.id === value && <Check className="w-4 h-4 text-[var(--cr-brand-500)]" />}
            </button>
          ))}

          <div className="border-t border-black/[0.06] mt-1 pt-1">
            {creating ? (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                  placeholder="Nome da seção"
                  className="flex-1 h-8 bg-[var(--cr-surface-soft)] border border-black/[0.12] rounded-lg px-2.5 text-xs focus:outline-none focus:border-[var(--cr-brand-500)]"
                />
                <button type="button" onClick={handleCreate} className="h-8 px-2.5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-xs font-semibold rounded-lg transition-colors">
                  Criar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-500)]/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova seção
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
