export interface DesignSettings {
  theme: string;
  header: string;
  wallpaper: string;
  buttons: string;
  text: string;
  colors: string;
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  theme: "Custom",
  header: "Classic",
  wallpaper: "Solid",
  buttons: "Outline",
  text: "Inter, System",
  colors: "Preto & Branco",
};

interface ColorPalette {
  brand: string;
  light: { bg: string; text: string; muted: string };
  dark: { bg: string; text: string; muted: string };
  gradient: string;
}

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  "Marsala": {
    brand: "#8C2F45",
    light: { bg: "#F7E9EC", text: "#2B1B33", muted: "rgba(43,27,51,0.62)" },
    dark: { bg: "#2B1B33", text: "#FFFFFF", muted: "rgba(255,255,255,0.72)" },
    gradient: "linear-gradient(160deg, #8C2F45 0%, #2B1B33 100%)",
  },
  "Preto & Branco": {
    brand: "#16162B",
    light: { bg: "#FAFAFA", text: "#16162B", muted: "rgba(22,22,43,0.6)" },
    dark: { bg: "#16162B", text: "#FFFFFF", muted: "rgba(255,255,255,0.72)" },
    gradient: "linear-gradient(160deg, #4B4768 0%, #16162B 100%)",
  },
  "Linho": {
    // Extraída das referências da Adriele: base de linho/cru, texto preto e o
    // azul petróleo do armário como único ponto de cor. Ela pediu texto sempre
    // preto ou branco, então o azul fica só em acento — nunca em leitura.
    brand: "#2F4A5C",
    light: { bg: "#F5F1EA", text: "#1A1A1A", muted: "rgba(26,26,26,0.58)" },
    dark: { bg: "#1A1A1A", text: "#FFFFFF", muted: "rgba(255,255,255,0.72)" },
    gradient: "linear-gradient(160deg, #F5F1EA 0%, #E2D9CB 100%)",
  },
  "Dourado": {
    brand: "#B9852F",
    light: { bg: "#FBF3E3", text: "#3B2A12", muted: "rgba(59,42,18,0.62)" },
    dark: { bg: "#3B2A12", text: "#FFFFFF", muted: "rgba(255,255,255,0.72)" },
    gradient: "linear-gradient(160deg, #F3D9A4 0%, #B9852F 100%)",
  },
};

const FONT_STACKS: Record<string, { heading: string; body: string }> = {
  "Poppins, Link Sans": { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
  "Inter, System": { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
  "Playfair, Inter": { heading: "'Playfair Display', serif", body: "'Inter', sans-serif" },
};

export interface ResolvedDesign {
  background: string;
  backgroundImage: string | null;
  textColor: string;
  mutedColor: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string | null;
  fontHeading: string;
  fontBody: string;
  headerVariant: string;
  brand: string;
}

export function resolveDesign(settings: DesignSettings | null | undefined, photoUrl: string | null): ResolvedDesign {
  const s = settings ?? DEFAULT_DESIGN_SETTINGS;
  const palette = COLOR_PALETTES[s.colors] ?? COLOR_PALETTES["Marsala"];
  const fonts = FONT_STACKS[s.text] ?? FONT_STACKS["Playfair, Inter"];

  let background: string;
  let backgroundImage: string | null = null;
  let textColor: string;
  let mutedColor: string;

  if (s.wallpaper === "Gradient") {
    background = palette.gradient;
    textColor = palette.dark.text;
    mutedColor = palette.dark.muted;
  } else if (s.wallpaper === "Foto" && photoUrl) {
    background = palette.dark.bg;
    backgroundImage = photoUrl;
    textColor = "#FFFFFF";
    mutedColor = "rgba(255,255,255,0.72)";
  } else {
    background = palette.light.bg;
    textColor = palette.light.text;
    mutedColor = palette.light.muted;
  }

  let buttonBg: string;
  let buttonText: string;
  let buttonBorder: string | null = null;

  if (s.buttons === "Solid") {
    buttonBg = palette.brand;
    buttonText = "#FFFFFF";
  } else if (s.buttons === "Outline") {
    buttonBg = "transparent";
    buttonText = textColor;
    buttonBorder = textColor === "#FFFFFF" ? "rgba(255,255,255,0.6)" : textColor;
  } else {
    buttonBg = textColor === "#FFFFFF" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.06)";
    buttonText = textColor;
    buttonBorder = textColor === "#FFFFFF" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)";
  }

  return {
    background,
    backgroundImage,
    textColor,
    mutedColor,
    buttonBg,
    buttonText,
    buttonBorder,
    fontHeading: fonts.heading,
    fontBody: fonts.body,
    headerVariant: s.header || "Classic",
    brand: palette.brand,
  };
}

// ─── Temas ───────────────────────────────────────────────────────────────────

export interface ThemePreset {
  settings: Omit<DesignSettings, "theme">;
  /** Amostra usada no seletor do dashboard */
  background: string;
  buttonBg: string;
  buttonBorder?: string;
  buttonText: string;
  textColor: string;
}

/**
 * Temas nomeados. Ficam aqui, e não na tela do dashboard, porque agora a página
 * pública também precisa deles — antes o editor tinha a própria lista e nada
 * disso chegava ao visitante.
 *
 * "Violeta" saiu junto com os presets antigos: era #6C63FF, o roxo que os brand
 * tokens proíbem e que foi removido do resto do produto.
 */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  "Pam Braga": {
    // A configuração que ela já usava: serifada, preto e branco, botão discreto
    settings: { header: "Classic", wallpaper: "Solid", buttons: "Glass", text: "Playfair, Inter", colors: "Preto & Branco" },
    background: "#FAFAFA",
    buttonBg: "rgba(0,0,0,0.06)",
    buttonBorder: "rgba(0,0,0,0.1)",
    buttonText: "#16162B",
    textColor: "#16162B",
  },
  "Adriele Nickhorn": {
    // Montado sobre as referências dela: fundo de linho, texto preto, botão
    // contornado (o texto continua preto, como ela pediu) e serifada elegante,
    // ecoando o "100% LINHO" das fotos. O azul entra só como acento.
    settings: { header: "Classic", wallpaper: "Solid", buttons: "Outline", text: "Playfair, Inter", colors: "Linho" },
    background: "#F5F1EA",
    buttonBg: "transparent",
    buttonBorder: "#1A1A1A",
    buttonText: "#1A1A1A",
    textColor: "#1A1A1A",
  },
};


/** Mistura duas cores hex. `t`=0 devolve `a`, `t`=1 devolve `b`. */
function mix(a: string, b: string, t: number): string {
  const n = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = n(a);
  const [r2, g2, b2] = n(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/**
 * Escala completa a partir da cor de marca do tema.
 *
 * Sobrescrever só 500/600/700 deixava --cr-brand-50/100/400 no rosa da Zafily,
 * e o rosa vazava em bordas, chips e abas de páginas que já tinham tema.
 */
function brandScale(brand: string): Record<string, string> {
  const claros: Array<[string, number]> = [["50", 0.94], ["100", 0.88], ["200", 0.76], ["300", 0.58], ["400", 0.3]];
  const escuros: Array<[string, number]> = [["600", 0.12], ["700", 0.26], ["800", 0.42], ["900", 0.58]];
  const out: Record<string, string> = { "--cr-brand-500": brand };
  for (const [k, t] of claros) out[`--cr-brand-${k}`] = mix(brand, "#ffffff", t);
  for (const [k, t] of escuros) out[`--cr-brand-${k}`] = mix(brand, "#000000", t);
  return out;
}

/**
 * Traduz o tema para as variáveis --cr-* que as páginas públicas já consomem.
 *
 * Devolve o conjunto inteiro, não só o fundo: sobrescrever fundo sem
 * sobrescrever superfície e borda deixaria cards claros sobre fundo escuro.
 * `null` = perfil sem tema, e a página segue com os tokens padrão.
 */
export function themeCssVars(
  settings: DesignSettings | null | undefined,
  photoUrl: string | null
): React.CSSProperties | undefined {
  if (!settings?.theme || !THEME_PRESETS[settings.theme]) return undefined;

  const d = resolveDesign(settings, photoUrl);
  const escuro = d.textColor.toUpperCase() === "#FFFFFF";
  const sobre = (a: number) => escuro ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;

  return {
    "--cr-background": d.background,
    "--cr-surface": escuro ? sobre(0.06) : "#FFFFFF",
    "--cr-surface-soft": sobre(0.05),
    "--cr-surface-hover": sobre(0.08),
    "--cr-text-primary": d.textColor,
    "--cr-text-secondary": d.mutedColor,
    "--cr-text-tertiary": d.mutedColor,
    "--cr-border": sobre(0.1),
    "--cr-border-strong": sobre(0.18),
    ...brandScale(d.brand),
    "--cr-font": d.fontBody,
    "--font-body": d.fontBody,
    "--font-heading": d.fontHeading,
  } as React.CSSProperties;
}
