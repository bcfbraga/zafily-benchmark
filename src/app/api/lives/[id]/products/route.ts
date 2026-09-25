import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getLive, countProducts, addProduct, getAccountStatus, nextProductPosition, existingProductKeys } from "@/lib/lives-store";
import { fetchUrlMetadata } from "@/lib/metadata";
import { compareByCategory } from "@/lib/utils";
import { identity, type DuplicateScope, type ImportReport } from "@/lib/link-import";

const MAX_PRODUCTS = 100;
const FREE_TIER_MAX_PRODUCTS = 5;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const live = await getLive(id, userId);
  if (!live) return NextResponse.json({ error: "Live não encontrada" }, { status: 404 });

  const { items: rawItems } = await req.json() as { items: { url: string; size?: string | null }[] };
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Nenhuma URL fornecida" }, { status: 400 });
  }

  // Entradas que não são URL (texto solto, espaços) saem aqui, mas agora são
  // devolvidas em vez de sumirem em silêncio.
  const invalid: string[] = [];
  const items = rawItems.filter(item => {
    try {
      const p = new URL(String(item.url).trim());
      if (p.protocol === "https:" || p.protocol === "http:") return true;
    } catch { /* cai no push abaixo */ }
    invalid.push(String(item.url).trim());
    return false;
  });

  if (items.length === 0) {
    return NextResponse.json({ error: "Nenhuma URL válida encontrada" }, { status: 400 });
  }

  // ── Duplicados, antes de buscar ────────────────────────────────────────────
  // Vale a pena filtrar já: cada link repetido custaria uma requisição à loja.
  const duplicates: { url: string; scope: DuplicateScope }[] = [];
  const jaNaVitrine = await existingProductKeys(id);
  const existentes = new Set(jaNaVitrine.map(p => identity(p.url, p.size)));
  const noLote = new Set<string>();
  const unicos = items.filter(item => {
    const chave = identity(item.url, item.size);
    if (existentes.has(chave)) { duplicates.push({ url: item.url, scope: "vitrine" }); return false; }
    if (noLote.has(chave)) { duplicates.push({ url: item.url, scope: "lote" }); return false; }
    noLote.add(chave);
    return true;
  });

  if (unicos.length === 0) {
    // Nada sobrou, mas isto não é erro: a usuária colou o que já estava lá.
    return NextResponse.json({
      products: [], skipped: 0,
      report: { duplicates, invalid, failed: [], partial: [] } satisfies ImportReport,
    });
  }

  const current = await countProducts(id);
  const accountStatus = await getAccountStatus(userId);
  const cap = accountStatus === "active" ? MAX_PRODUCTS : FREE_TIER_MAX_PRODUCTS;
  const slots = cap - current;
  if (slots <= 0) {
    return NextResponse.json({
      error: accountStatus === "active"
        ? `Limite de ${MAX_PRODUCTS} produtos atingido`
        : `No plano gratuito você pode adicionar até ${FREE_TIER_MAX_PRODUCTS} produtos por vitrine. Ative sua conta para adicionar mais.`,
      code: accountStatus === "active" ? undefined : "activation_required",
    }, { status: accountStatus === "active" ? 400 : 403 });
  }

  const toProcess = unicos.slice(0, slots);

  // Busca os metadados de todos antes de gravar: só dá para agrupar por
  // categoria depois de saber a categoria de cada link.
  const enriched = await Promise.all(
    toProcess.map(async (item, i) => ({ item, meta: await fetchUrlMetadata(item.url), ordemEnvio: i }))
  );

  // ── Duplicados que só aparecem depois de resolver o redirect ───────────────
  // Dois links de afiliado diferentes podem cair no mesmo produto. Isso só se
  // enxerga com a URL final em mãos, então a segunda passada vem aqui.
  const resolvidos = new Set(
    jaNaVitrine.filter(p => p.productUrl).map(p => identity(p.productUrl!, p.size))
  );
  const noLoteResolvido = new Set<string>();
  const aGravar = enriched.filter(({ item, meta }) => {
    if (!meta.productUrl) return true;
    const chave = identity(meta.productUrl, item.size);
    if (resolvidos.has(chave)) { duplicates.push({ url: item.url, scope: "vitrine" }); return false; }
    if (noLoteResolvido.has(chave)) { duplicates.push({ url: item.url, scope: "lote" }); return false; }
    noLoteResolvido.add(chave);
    return true;
  });

  const failed = aGravar
    .filter(({ meta }) => meta.status === "failed")
    .map(({ item, meta }) => ({ url: item.url, reason: meta.error ?? "Não foi possível ler o link." }));
  const partial = aGravar
    .filter(({ meta }) => meta.status === "partial")
    .map(({ item, meta }) => ({ url: item.url, reason: meta.error ?? "Faltaram dados no link." }));

  // Agrupa por categoria em ordem alfabética, ignorando a ordem em que os links
  // foram colados. Dentro de uma mesma categoria a ordem de envio é mantida, e
  // produtos sem categoria vão para o fim.
  const sorted = aGravar.sort((a, b) => {
    const porCategoria = compareByCategory(a.meta, b.meta);
    return porCategoria !== 0 ? porCategoria : a.ordemEnvio - b.ordemEnvio;
  });

  // Sempre no fim da lista, para não embaralhar o que a usuária já ordenou.
  const startPosition = await nextProductPosition(id);

  // O produto que falhou é gravado do mesmo jeito, marcado. Descartá-lo faria a
  // usuária perder o link colado e ter de descobrir sozinha qual dos vinte não
  // entrou.
  const results = await Promise.all(
    sorted.map(({ item, meta }, i) =>
      addProduct(id, {
        url: item.url,
        name: meta.name,
        imageUrl: meta.imageUrl,
        price: meta.price,
        category: meta.category,
        productUrl: meta.productUrl,
        size: item.size ?? null,
        position: startPosition + i,
        importStatus: meta.status,
        importError: meta.error,
      })
    )
  );

  return NextResponse.json({
    products: results,
    skipped: unicos.length - toProcess.length,
    report: { duplicates, invalid, failed, partial } satisfies ImportReport,
  });
}
