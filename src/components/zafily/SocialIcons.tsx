/** As redes com ícone próprio. A lista de redes em si é aberta — ver `SocialIcon`. */
export type Platform = "instagram" | "pinterest" | "youtube" | "tiktok" | "twitter";

/**
 * Rótulo de exibição de uma rede. Para as conhecidas vem da lista; para
 * qualquer outra, capitaliza o próprio identificador ("twitch" → "Twitch"),
 * que é o suficiente para uma lista aberta sem exigir mais um campo no banco.
 */
export function socialLabel(platform: string): string {
  const conhecida = SOCIAL_PLATFORMS.find(p => p.value === platform);
  if (conhecida) return conhecida.label;
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

export const SOCIAL_PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "pinterest", label: "Pinterest" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X / Twitter" },
];

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M10 17c1-3.5 1.5-5.5 1.5-5.5s-.4-.8-.4-2c0-1.9 1.1-3.3 2.5-3.3 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.7-.3 1.4.7 2.6 2.1 2.6 2.5 0 4.2-3.2 4.2-6.9 0-2.9-2-5-5.6-5-4.1 0-6.6 3-6.6 6.2 0 1.1.4 2 .9 2.6.1.1.1.2.1.3-.1.3-.2.9-.3 1.1-.1.2-.2.3-.4.2-1.4-.6-2.2-2.5-2.2-4.1 0-3.3 2.4-6.4 7-6.4 3.7 0 6.5 2.6 6.5 6.1 0 3.6-2.3 6.6-5.5 6.6-1.1 0-2.1-.6-2.5-1.2 0 0-.5 2.1-.7 2.7-.3 1-1 2-1.6 2.7"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10.5 9.5L15 12l-4.5 2.5v-5z" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M14 3v10.8a2.7 2.7 0 1 1-2.2-2.65"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 3.2c.4 2 2 3.5 4 3.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M4 4l7 8.5L4.3 20H6l5.8-6.3L16.5 20H20l-7.4-9L20 4h-1.7l-5.4 5.8L8 4H4z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      // Rede fora da lista conhecida: globo genérico, para que a lista aberta
      // não dependa de alguém desenhar um SVG antes.
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}
