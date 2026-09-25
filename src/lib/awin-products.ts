const PRODUCT_DATA_BASE = "https://productdata.awin.com/datafeed";
const CEA_ADVERTISER_ID = 17648;

export interface AwinFeed {
  feedId: number;
  advertiserId: number;
  advertiserName: string;
  language: string;
  primaryRegion: string;
  noOfProducts: number;
}

export interface AwinProduct {
  aw_product_id: string;
  product_name: string;
  description: string;
  search_price: string;
  merchant_image_url: string;
  aw_image_url: string;
  aw_deep_link: string;
  merchant_deep_link: string;
  merchant_category: string;
  category_name: string;
  brand_name: string;
  colour: string;
  merchant_id: string;
  merchant_name: string;
  in_stock: string;
}

export type FeedListResult =
  | { ok: true; feeds: AwinFeed[] }
  | { ok: false; message: string };

export type ProductFetchResult =
  | { ok: true; products: AwinProduct[] }
  | { ok: false; message: string };

// Step 1 — get list of available feeds for this publisher
export async function getAvailableFeeds(apiToken: string): Promise<FeedListResult> {
  let res: Response;
  try {
    res = await fetch(`${PRODUCT_DATA_BASE}/list/apikey/${apiToken}`, {
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    return { ok: false, message: `Could not reach Awin: ${err instanceof Error ? err.message : err}` };
  }

  if (!res.ok) {
    return { ok: false, message: `Awin feed list returned HTTP ${res.status}` };
  }

  const data = await res.json();
  const feeds: AwinFeed[] = Array.isArray(data) ? data : data.feeds ?? [];
  return { ok: true, feeds };
}

// Step 2 — download products from a specific feed (with optional limit)
export async function fetchProductsFromFeed(
  apiToken: string,
  feedId: number,
  limit = 200
): Promise<ProductFetchResult> {
  const columns = [
    "aw_product_id",
    "product_name",
    "description",
    "search_price",
    "merchant_image_url",
    "aw_image_url",
    "aw_deep_link",
    "merchant_deep_link",
    "merchant_category",
    "category_name",
    "brand_name",
    "colour",
    "merchant_id",
    "merchant_name",
    "in_stock",
  ].join(",");

  const url =
    `${PRODUCT_DATA_BASE}/download/apikey/${apiToken}` +
    `/language/pt_BR/fid/${feedId}` +
    `/columns/${columns}` +
    `/format/json` +
    `/limit/${limit}/`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch (err) {
    return { ok: false, message: `Feed download failed: ${err instanceof Error ? err.message : err}` };
  }

  if (!res.ok) {
    return { ok: false, message: `Feed download returned HTTP ${res.status}` };
  }

  const data = await res.json();
  const products: AwinProduct[] = Array.isArray(data) ? data : data.products ?? [];
  return { ok: true, products };
}

// Combined — find C&A feed then fetch products
export async function fetchCeaProducts(
  apiToken: string,
  limit = 200
): Promise<ProductFetchResult> {
  const feedsResult = await getAvailableFeeds(apiToken);
  if (!feedsResult.ok) return feedsResult;

  const ceaFeed = feedsResult.feeds.find(
    (f) => f.advertiserId === CEA_ADVERTISER_ID
  );

  if (!ceaFeed) {
    return {
      ok: false,
      message:
        "C&A feed not found. Make sure you are approved in the C&A BR programme on Awin.",
    };
  }

  return fetchProductsFromFeed(apiToken, ceaFeed.feedId, limit);
}
