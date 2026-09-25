"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
  /** Override the default body padding — pass "" when children manage their own section padding. */
  bodyClassName?: string;
  /** Override the card's corner radius — defaults to rounded-2xl. */
  radiusClassName?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, maxWidth = "max-w-md", bodyClassName, radiusClassName = "rounded-2xl", children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative bg-[var(--cr-surface)] border border-[var(--cr-border)] shadow-[var(--cr-shadow-floating)] w-full max-h-[85dvh] overflow-y-auto",
          radiusClassName,
          maxWidth
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h3 className="font-semibold text-[var(--cr-text-primary)]">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cr-text-secondary)] hover:text-[var(--cr-text-primary)] hover:bg-[var(--cr-surface-hover)] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={bodyClassName ?? (title ? "px-6 pb-6" : "p-6")}>{children}</div>
      </div>
    </div>
  );
}
