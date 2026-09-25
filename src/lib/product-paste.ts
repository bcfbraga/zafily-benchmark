/**
 * Leitura do texto colado na importação de produtos.
 *
 * O formato é livre: uma linha de rótulo seguida do link. O rótulo costuma ser
 * o nome do produto com o tamanho no fim ("jaqueta jeans azul-P"), mas também
 * aparece como uma linha contendo só o tamanho ("M"), que é como a lista chega
 * de algumas lojas e grupos.
 */

const TAMANHOS = "PP|P|M|G|GG|GGG|XG|EG|EXG|U|\\d{2,3}";

/** Tamanho no fim do nome: "vestido midi preto-M". */
const SIZE_SUFFIX = new RegExp(`-\\s*(${TAMANHOS})\\s*$`, "i");

/**
 * Linha que é só o tamanho: "M", "38", "Tam G", "Tamanho: GG".
 *
 * Só casa quando a linha inteira é o tamanho, então não há como confundir com
 * um nome de produto — "Blusa M" continua sendo nome, não tamanho.
 */
const SIZE_ONLY = new RegExp(`^(?:tam(?:anho)?\\.?:?\\s*)?(${TAMANHOS})$`, "i");

/**
 * Um link em qualquer ponto da linha. Antes exigia-se que a linha inteira
 * fosse a URL, e uma linha como "PERFUMES ALCHEMIA https://..." virava rótulo:
 * o link sumia sem virar produto e sem aparecer em aviso nenhum.
 */
const URL_NA_LINHA = /https?:\/\/\S+/;

/** Tira pontuação que costuma vir colada no fim de link em texto corrido. */
function trimUrl(url: string): string {
  return url.replace(/[.,;:]+$/, "");
}

export function isValidUrl(text: string): boolean {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function extractSize(labelLine: string | null): string | null {
  if (!labelLine) return null;
  const match = labelLine.match(SIZE_SUFFIX) ?? labelLine.match(SIZE_ONLY);
  return match ? match[1].toUpperCase() : null;
}

export function parseProductInput(text: string): { url: string; size: string | null }[] {
  const items: { url: string; size: string | null }[] = [];
  let labelLine: string | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const match = line.match(URL_NA_LINHA);
    const url = match ? trimUrl(match[0]) : null;

    if (!url || !isValidUrl(url)) {
      labelLine = line;
      continue;
    }

    // O que acompanha o link na mesma linha vale mais que a linha anterior:
    // quem escreveu "M https://..." está falando deste link, não do de cima.
    const inicio = match!.index ?? 0;
    const antes = line.slice(0, inicio).trim();
    const depois = line.slice(inicio + match![0].length).trim();
    items.push({ url, size: extractSize(antes || depois || labelLine) });
    labelLine = null;
  }
  return items;
}
