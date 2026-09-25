"use client";

import { useState } from "react";
import { Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitEditorLayoutProps {
  editPanel: React.ReactNode;
  previewPanel: React.ReactNode;
  editPanelClassName?: string;
  previewPanelClassName?: string;
}

// Desktop (lg+): edit panel and preview side by side, unchanged from the
// original fixed-width layout. Below lg there's no room for both, so a pill
// toggle switches between them one at a time instead of clipping content.
export function SplitEditorLayout({ editPanel, previewPanel, editPanelClassName, previewPanelClassName }: SplitEditorLayoutProps) {
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <div className="lg:hidden flex items-center justify-center py-2 border-b border-[var(--cr-border)] bg-[var(--cr-background)] shrink-0">
        <div className="flex items-center gap-0.5 bg-[var(--cr-surface)] rounded-full p-0.5 border border-[var(--cr-border)]">
          <button
            type="button"
            onClick={() => setMobileView("edit")}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-colors",
              mobileView === "edit" ? "bg-[var(--cr-brand-600)] text-white" : "text-[var(--cr-text-tertiary)]"
            )}
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold transition-colors",
              mobileView === "preview" ? "bg-[var(--cr-brand-600)] text-white" : "text-[var(--cr-text-tertiary)]"
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Visualizar
          </button>
        </div>
      </div>

      <div className={cn("w-full lg:w-[360px] lg:shrink-0 overflow-y-auto", mobileView === "edit" ? "block" : "hidden lg:block", editPanelClassName)}>
        {editPanel}
      </div>
      <div className={cn("flex-1 overflow-y-auto", mobileView === "preview" ? "block" : "hidden lg:block", previewPanelClassName)}>
        {previewPanel}
      </div>
    </div>
  );
}
