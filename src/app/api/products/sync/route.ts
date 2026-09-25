import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations-store";
import { decrypt } from "@/lib/crypto";
import { fetchCeaProducts } from "@/lib/awin-products";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integration = await getIntegration(userId);
  if (!integration || integration.status === "disconnected") {
    return NextResponse.json(
      { error: "Awin integration not connected" },
      { status: 400 }
    );
  }

  const apiToken = decrypt(integration.encryptedToken);
  const result = await fetchCeaProducts(apiToken, 200);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  const db = getSupabase() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const rows = result.products.map((p) => ({
    user_id: userId,
    advertiser_id: 17648,
    aw_product_id: p.aw_product_id,
    name: p.product_name,
    description: p.description || null,
    price: p.search_price ? parseFloat(p.search_price) : null,
    image_url: p.aw_image_url || p.merchant_image_url || null,
    deep_link: p.aw_deep_link,
    merchant_deep_link: p.merchant_deep_link || null,
    category: p.category_name || p.merchant_category || null,
    brand: p.brand_name || null,
    colour: p.colour || null,
    in_stock: p.in_stock === "1" || p.in_stock === "true",
    synced_at: new Date().toISOString(),
  }));

  const { error } = await db
    .from("affiliate_products")
    .upsert(rows, { onConflict: "user_id,advertiser_id,aw_product_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ synced: rows.length });
}
