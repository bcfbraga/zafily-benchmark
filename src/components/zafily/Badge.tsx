import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-[#e7f7ef] text-[#287451]",
  warning: "bg-[rgba(255,200,87,0.20)] text-[#8A6A1B]",
  error: "bg-[rgba(225,29,72,0.10)] text-[#E11D48]",
  info: "bg-[rgba(247, 89, 173,0.14)] text-[var(--cr-brand-700)]",
  neutral: "bg-black/[0.05] text-[var(--cr-text-secondary)]",
};

export function ZafilyBadge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
