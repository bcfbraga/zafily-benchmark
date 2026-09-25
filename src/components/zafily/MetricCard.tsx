import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, change, trend = "neutral", icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "metric-card-bg border border-[rgba(255,255,255,0.08)] rounded-[4px] p-6",
        "shadow-[0_16px_48px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-[#B8B4E8]">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[rgba(247, 89, 173,0.16)] flex items-center justify-center text-[var(--cr-brand-500)]">
            {icon}
          </div>
        )}
      </div>
      <p className="font-heading text-[32px] font-bold text-white leading-none mb-2">{value}</p>
      {change && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-[var(--cr-success)]" />}
          {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-[#FF5F7E]" />}
          {trend === "neutral" && <Minus className="w-3.5 h-3.5 text-[#7E78B8]" />}
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-[var(--cr-success)]",
              trend === "down" && "text-[#FF5F7E]",
              trend === "neutral" && "text-[#7E78B8]"
            )}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
