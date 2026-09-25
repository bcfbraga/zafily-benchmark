"use client";

import { cn } from "@/lib/utils";
import { ZafilyBadge } from "./Badge";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  name: string;
  platform: string;
  category: string;
  commission: string;
  status: "active" | "pending" | "paused";
  imageUrl?: string;
  className?: string;
}

const statusMap = {
  active: { label: "Active", variant: "success" as const },
  pending: { label: "Pending", variant: "warning" as const },
  paused: { label: "Paused", variant: "neutral" as const },
};

export function ProductCard({
  name,
  platform,
  category,
  commission,
  status,
  imageUrl,
  className,
}: ProductCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const { label, variant } = statusMap[status];

  return (
    <div
      className={cn(
        "bg-white border border-[rgba(255,255,255,0.08)] rounded-[4px] p-4",
        "shadow-[0_16px_48px_rgba(0,0,0,0.28)] flex flex-col gap-4",
        "hover:border-[rgba(247, 89, 173,0.24)] transition-colors duration-200",
        className
      )}
    >
      {/* Image */}
      <div className="bg-white rounded-[4px] aspect-square w-full overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center">
            <span className="text-[#aaa] text-xs font-medium">IMG</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading font-semibold text-sm text-white leading-snug line-clamp-2">{name}</p>
          <ZafilyBadge variant={variant}>{label}</ZafilyBadge>
        </div>
        <p className="text-xs text-[var(--cr-text-tertiary)]">{platform}</p>
        <p className="text-xs text-[var(--cr-text-secondary)]">{category}</p>
      </div>

      {/* Commission */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[var(--cr-text-tertiary)] uppercase tracking-wider mb-0.5">Commission</p>
          <p className="text-[var(--cr-success)] font-semibold text-sm font-heading">{commission}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-xs font-semibold rounded-[4px] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.08)] text-[var(--cr-text-secondary)] rounded-[4px] transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
