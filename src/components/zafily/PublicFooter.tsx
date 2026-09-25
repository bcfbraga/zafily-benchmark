import Link from "next/link";

/**
 * Assinatura das páginas públicas. Era só texto; agora leva quem descobriu a
 * Zafily pela vitrine de uma creator até o site — é o canal de aquisição mais
 * natural que existe aqui.
 *
 * Link relativo de propósito: funciona em produção, em preview e no local sem
 * domínio cravado.
 */
export function PublicFooter() {
  return (
    <div className="py-6 text-center" style={{ borderTop: "1px solid var(--cr-border)" }}>
      <p className="text-xs" style={{ color: "var(--cr-text-tertiary)" }}>
        Criado com{" "}
        <Link
          href="/"
          className="font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--cr-text-secondary)" }}
        >
          Zafily
        </Link>
        {" · "}
        {new Date().getFullYear()}
      </p>
    </div>
  );
}
