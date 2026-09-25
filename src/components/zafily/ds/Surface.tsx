import { cn } from "@/lib/utils";

/**
 * O módulo arredondado que flutua sobre o canvas — a peça central do sistema.
 *
 * Toda a separação é tonal + 1px de borda. Sem drop shadow: as referências
 * parecem premium justamente porque o contraste vem do tom, não de sombra.
 */

export type SurfaceTone = "primary" | "secondary" | "dark" | "brand" | "bare";
export type SurfaceSize = "sm" | "md" | "lg" | "flush";

const TONE: Record<SurfaceTone, React.CSSProperties> = {
  // Painel branco sobre o canvas — o caso mais comum
  primary: { background: "var(--surface-primary)", border: "1px solid var(--border-subtle)" },
  // Card um tom abaixo, para usar dentro de um painel branco
  secondary: { background: "var(--surface-secondary)", border: "1px solid transparent" },
  // Alto contraste, para ancorar a composição (hero, CTA final)
  dark: { background: "var(--surface-dark)", color: "#FFFFFF", border: "1px solid var(--border-on-dark)" },
  // Destaque de marca — usado com parcimônia, nunca como fundo de seção inteira
  brand: { background: "var(--surface-brand)", border: "1px solid var(--border-subtle)" },
  // Só a geometria: para quando o conteúdo (imagem) é a superfície
  bare: { background: "transparent", border: "1px solid transparent" },
};

const PADDING: Record<SurfaceSize, string> = {
  sm: "var(--space-md)",
  md: "var(--surface-padding)",
  lg: "var(--surface-padding-lg)",
  flush: "0px", // imagem sangrando até a borda arredondada
};

interface SurfaceProps {
  tone?: SurfaceTone;
  size?: SurfaceSize;
  /** Containers grandes usam xl; cards internos, lg. */
  radius?: "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

export function Surface({ tone = "primary", size = "md", radius = "xl", className, children }: SurfaceProps) {
  return (
    <div
      className={cn("h-full overflow-hidden", className)}
      style={{
        ...TONE[tone],
        borderRadius: radius === "xl" ? "var(--radius-xl)" : "var(--radius-lg)",
        padding: PADDING[size],
      }}
    >
      {children}
    </div>
  );
}
