/**
 * Regras de importação de links de produto: identidade (para detectar
 * duplicados) e o formato do relatório devolvido ao dashboard.
 */

/** Onde o link repetido foi encontrado. */
export type DuplicateScope = "lote" | "vitrine";

/**
 * O que a importação tem a dizer sobre os links que não entraram limpos.
 * Nada aqui é erro fatal: a resposta segue com status 200 e os produtos
 * gravados, isto é apenas o que a usuária precisa revisar.
 */
export interface ImportReport {
  /** Ignorados por já existirem — nunca chegam a ser gravados. */
  duplicates: { url: string; scope: DuplicateScope }[];
  /** Linhas que não eram URL. */
  invalid: string[];
  /** Gravados, mas sem nome nem imagem. */
  failed: { url: string; reason: string }[];
  /** Gravados com um dos dois faltando. */
  partial: { url: string; reason: string }[];
}

/**
 * Chave de comparação de links. O host vira minúsculo e a barra final e o
 * fragmento saem, porque nenhum dos três muda a página. A query **fica**: em
 * link de afiliado é ela que carrega o código da comissão, e dois links que só
 * diferem nela podem ir para a mesma loja com contas diferentes.
 *
 * O efeito colateral é que `?utm_source=x` escapa desta comparação — por isso a
 * importação faz uma segunda passada com a URL já resolvida, onde o parâmetro
 * de campanha não existe mais.
 */
export function urlKey(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.hostname.toLowerCase()}${path}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

/**
 * Mesmo produto em tamanhos diferentes é entrada legítima — a vitrine aceita
 * "Nome-M" e "Nome-G" apontando para o mesmo link —, então o tamanho entra na
 * identidade.
 */
export function identity(url: string, size: string | null | undefined): string {
  return `${urlKey(url)}|${(size ?? "").trim().toUpperCase()}`;
}
