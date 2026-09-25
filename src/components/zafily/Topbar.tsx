"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileNavDrawer } from "./MobileNavDrawer";

interface TopbarProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Topbar({ title, description, action }: TopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-[72px] shrink-0 border-b border-black/[0.08] flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[4px] bg-black/[0.03] border border-black/[0.08] text-[var(--cr-text-tertiary)] hover:text-[var(--cr-text-primary)] transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold text-[var(--cr-text-primary)] truncate">{title}</h1>
            {description && <p className="text-xs text-[var(--cr-text-tertiary)] mt-0.5 truncate">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hidden shrink-0">
          {action}
        </div>
      </header>
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
