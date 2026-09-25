import { SocialIcon, socialLabel } from "./SocialIcons";
import type { SocialLink } from "@/lib/lives-store";

/**
 * Redes sociais do perfil na página pública.
 *
 * Os dados já existiam no banco e já eram editáveis no dashboard, mas nunca
 * chegavam a ser desenhados aqui — a página pública mostrava só o @handle.
 */
export function PublicSocialRow({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <nav aria-label="Redes sociais" className="flex items-center justify-center gap-2 flex-wrap mb-8">
      {links.map(link => (
        <a
          key={`${link.platform}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={socialLabel(link.platform)}
          aria-label={socialLabel(link.platform)}
          // 44px de alvo: é a mesma medida dos botões de cupom, e aqui os
          // ícones ficam lado a lado, onde errar o toque é mais fácil.
          className="w-11 h-11 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
          style={{
            background: "var(--cr-surface-soft)",
            border: "1px solid var(--cr-border)",
            color: "var(--cr-text-primary)",
          }}
        >
          <SocialIcon platform={link.platform} className="w-[18px] h-[18px]" />
        </a>
      ))}
    </nav>
  );
}
