/**
 * Resultado da busca de um link.
 *
 *   ok      → nome e imagem encontrados
 *   partial → veio só um dos dois; publica, mas fica capenga
 *   failed  → nada aproveitável, o link precisa de atenção
 */
export type ImportStatus = "ok" | "partial" | "failed";

export interface UrlMetadata {
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  category: string | null;
  productUrl: string | null;
  status: ImportStatus;
  /** Motivo em português, para mostrar à usuária. `null` quando `status === "ok"`. */
  error: string | null;
}

/**
 * Deriva o status a partir do que a busca conseguiu extrair. O nome e a imagem
 * são o que a vitrine realmente precisa — preço e categoria são desejáveis, mas
 * a usuária preenche à mão sem esforço.
 */
function classify(
  meta: Pick<UrlMetadata, "name" | "imageUrl">,
  motivoDaFalha: string,
): { status: ImportStatus; error: string | null } {
  const temNome = !!meta.name?.trim();
  const temImagem = !!meta.imageUrl?.trim();
  if (temNome && temImagem) return { status: "ok", error: null };
  if (!temNome && !temImagem) return { status: "failed", error: motivoDaFalha };
  return {
    status: "partial",
    error: temNome ? "A imagem do produto não foi encontrada." : "O nome do produto não foi encontrado.",
  };
}

/** Traduz a resposta HTTP da loja em algo acionável. */
function httpErrorMessage(status: number): string {
  if (status === 404 || status === 410) return "O link não existe mais na loja (erro 404).";
  if (status === 401 || status === 403) return "A loja bloqueou a leitura automática (erro 403).";
  if (status === 429) return "A loja recusou por excesso de acessos — tente de novo em alguns minutos.";
  if (status >= 500) return `A loja está fora do ar no momento (erro ${status}).`;
  return `A loja respondeu com erro ${status}.`;
}

const AFFILIATE_DOMAINS = [
  "awin1.com", "tidd.ly", "go.redirectingat.com", "rstyle.me",
  "shareasale.com", "linksynergy.com", "prf.hn", "clktr.ac",
];
const AFFILIATE_PARAMS = ["awc=", "pub_ref=", "clickid=", "aff_id="];

// ── Minha C&A resolver ───────────────────────────────────────────────────────
// minhacea.cea.com.br/?lcea=BASE64 → calls api.cea.com.br to get the real URL

async function resolveMinhaCea(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("minhacea.cea.com.br")) return null;
    const lcea = u.searchParams.get("lcea");
    if (!lcea) return null;
    const res = await fetch(`https://api.cea.com.br/minhacea/link/v1/${lcea}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; data: string };
    return data.success && data.data ? data.data : null;
  } catch { return null; }
}

function isAffiliateUrl(url: string): boolean {
  try {
    const { hostname, search } = new URL(url);
    if (hostname.includes("minhacea.cea.com.br")) return true;
    if (AFFILIATE_DOMAINS.some(d => hostname.includes(d))) return true;
    if (AFFILIATE_PARAMS.some(p => search.includes(p))) return true;
    return false;
  } catch { return false; }
}

async function resolveUrl(url: string): Promise<string> {
  // Minha C&A links need special API resolution
  const minhaCea = await resolveMinhaCea(url);
  if (minhaCea) return minhaCea;

  // Generic redirect follow via HEAD
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Zafily/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return res.url || url;
  } catch { return url; }
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));
}

// ── VTEX API ─────────────────────────────────────────────────────────────────
// Detects VTEX product URLs (ending in /p or /p?sku=...) and calls the catalog API

function getVtexSlug(url: string): { origin: string; slug: string } | null {
  try {
    const u = new URL(url);
    // VTEX product URLs end with /p or /p?sku=xxx
    if (!/\/p(\?.*)?$/.test(u.pathname)) return null;
    const slug = u.pathname.replace(/\/p$/, "").replace(/^\//, "");
    if (!slug) return null;
    return { origin: u.origin, slug };
  } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchVtexProduct(origin: string, slug: string): Promise<UrlMetadata | null> {
  try {
    const apiUrl = `${origin}/api/catalog_system/pub/products/search/${encodeURIComponent(slug)}?map=ft`;
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const product = data[0];
    const name: string = product.productName ?? product.productTitle ?? null;

    // First SKU image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = product.items ?? [];
    let imageUrl: string | null = null;
    if (items.length > 0 && items[0].images?.length > 0) {
      imageUrl = items[0].images[0].imageUrl ?? null;
    }

    // Price from first SKU seller
    let price: string | null = null;
    if (items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seller = items[0].sellers?.[0];
      const priceVal = seller?.commertialOffer?.Price ?? seller?.commertialOffer?.ListPrice;
      if (priceVal != null) {
        price = `R$ ${Number(priceVal).toFixed(2).replace(".", ",")}`;
      }
    }

    // Category from categoryTree (last leaf), falling back to keyword inference from the name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryTree: any[] = product.categoryTree ?? [];
    const category: string | null = (categoryTree.length > 0 ? categoryTree[categoryTree.length - 1].name : null)
      ?? inferCategoryFromName(name);

    return {
      name, imageUrl, price, category,
      productUrl: `${origin}/${slug}/p`,
      ...classify({ name, imageUrl }, "A loja não devolveu dados para este produto."),
    };
  } catch { return null; }
}

// ── HTML fallback ────────────────────────────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtml(m[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtml(m[1].trim()) : null;
}

function extractLdJson(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of matches) {
    const inner = block.replace(/<\/?script[^>]*>/gi, "");
    try {
      const obj = JSON.parse(inner);
      if (Array.isArray(obj)) blocks.push(...obj);
      else blocks.push(obj);
    } catch { /* ignore */ }
  }
  return blocks;
}

function findProductLd(blocks: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const obj of blocks) {
    const type = obj["@type"];
    if (type === "Product") return obj;
    const graph = obj["@graph"];
    if (Array.isArray(graph)) {
      const p = graph.find((g: unknown) => (g as Record<string, unknown>)?.["@type"] === "Product");
      if (p) return p as Record<string, unknown>;
    }
  }
  return null;
}

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\bcal[çc]a\b/i, "Calças"],
  [/\bvestido\b/i, "Vestidos"],
  [/\bsaia\b/i, "Saias"],
  [/\bblusa\b/i, "Blusas"],
  [/\bcamiseta\b/i, "Camisetas"],
  [/\bpolo\b/i, "Polos"],
  [/\bjaqueta\b/i, "Jaquetas"],
  [/\bcasaco\b/i, "Casacos"],
  [/\bcardigan\b/i, "Cardigans"],
  [/\bsu[eé]ter\b/i, "Suéteres"],
  [/\bblazer\b/i, "Blazers"],
  [/\bcinto\b/i, "Acessórios"],
  [/\bbata\b/i, "Batas"],
  [/\bshort\b/i, "Shorts"],
  [/\bregata\b/i, "Regatas"],
  [/\bmacac[ãa]o\b/i, "Macacões"],
  [/\bbermuda\b/i, "Bermudas"],
];

function inferCategoryFromName(name: string | null): string | null {
  if (!name) return null;
  for (const [re, label] of CATEGORY_KEYWORDS) {
    if (re.test(name)) return label;
  }
  return null;
}

function extractFromHtml(html: string): Pick<UrlMetadata, "name" | "imageUrl" | "price" | "category"> {
  const ldBlocks = extractLdJson(html);
  const product = findProductLd(ldBlocks);

  // Name
  let name: string | null = null;
  if (product?.name && typeof product.name === "string") name = decodeHtml(product.name);
  if (!name) {
    const ogTitle = extractMeta(html, "og:title");
    if (ogTitle?.includes("|")) name = ogTitle.split("|")[0].trim();
    else if (ogTitle && ogTitle.length > 10) name = ogTitle;
  }
  if (!name) {
    const t = extractTitle(html);
    if (t?.includes("|")) name = t.split("|")[0].trim();
    else if (t?.includes(" - ")) name = t.split(" - ")[0].trim();
    else name = t;
  }

  // Image
  let imageUrl: string | null = null;
  if (product?.image) {
    const img = product.image;
    if (typeof img === "string") imageUrl = img;
    else if (Array.isArray(img) && typeof img[0] === "string") imageUrl = img[0];
    else if (typeof img === "object" && img !== null && typeof (img as Record<string, unknown>).url === "string")
      imageUrl = (img as Record<string, unknown>).url as string;
  }
  if (!imageUrl) imageUrl = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");

  // Price
  let price: string | null = null;
  if (product) {
    const offers = product.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const offer = Array.isArray(offers) ? offers[0] : offers;
    const nestedOffers = offer?.offers;
    const nestedOffer = Array.isArray(nestedOffers) ? (nestedOffers as Record<string, unknown>[])[0] : undefined;
    const p = offer?.price ?? nestedOffer?.price ?? offer?.lowPrice ?? product.price;
    if (p != null) {
      const num = parseFloat(String(p));
      price = !isNaN(num) ? `R$ ${num.toFixed(2).replace(".", ",")}` : String(p);
    }
  }
  if (!price) price = extractMeta(html, "og:price:amount") || extractMeta(html, "product:price:amount");

  // Category
  let category: string | null = null;
  if (product?.category && typeof product.category === "string") category = product.category;
  if (!category) {
    for (const obj of ldBlocks) {
      const cat = (obj as Record<string, unknown>)?.category;
      if (cat && typeof cat === "string") { category = cat; break; }
    }
  }
  if (!category) category = extractMeta(html, "og:category") || extractMeta(html, "product:category") || null;
  if (!category) category = inferCategoryFromName(name);

  return { name, imageUrl, price, category };
}

// ── Main entry ───────────────────────────────────────────────────────────────

export async function fetchUrlMetadata(affiliateUrl: string): Promise<UrlMetadata> {
  const vazio = { name: null, imageUrl: null, price: null, category: null };

  try {
    // Passo 1: resolve redirects de links de afiliado
    const productUrl = isAffiliateUrl(affiliateUrl) ? await resolveUrl(affiliateUrl) : affiliateUrl;

    // Passo 2a: VTEX API (C&A, Renner, Hering, etc.)
    const vtex = getVtexSlug(productUrl);
    if (vtex) {
      const result = await fetchVtexProduct(vtex.origin, vtex.slug);
      if (result?.name) return result;
    }

    // Passo 2b: HTML fallback para outros sites
    const res = await fetch(productUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    if (!res.ok) {
      return { ...vazio, productUrl, status: "failed", error: httpErrorMessage(res.status) };
    }
    const html = await res.text();
    const meta = extractFromHtml(html);
    return {
      ...meta,
      productUrl,
      ...classify(meta, "A página abriu, mas não tem dados de produto — confira se o link leva a um produto."),
    };
  } catch {
    // Timeout, DNS, TLS: em nenhum desses casos chegamos a ver a página.
    return {
      ...vazio,
      productUrl: null,
      status: "failed",
      error: "A loja não respondeu (link fora do ar ou tempo esgotado).",
    };
  }
}
