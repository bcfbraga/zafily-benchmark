import { getSupabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export interface Coupon {
  id: string;
  userId: string;
  /** Nome da loja/marca parceira. */
  storeName: string;
  /** Categoria ou tipo de produto ("Skincare", "Moda"). Opcional. */
  category: string | null;
  /** Texto livre: "20% OFF", "R$30 OFF acima de R$150", "Frete grátis". */
  discountLabel: string;
  /** Nulo em oferta que é só link, sem código para copiar. */
  code: string | null;
  url: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

function rowToCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    storeName: row.store_name as string,
    category: (row.category as string) ?? null,
    discountLabel: row.discount_label as string,
    code: (row.code as string) ?? null,
    url: row.url as string,
    isActive: row.is_active as boolean,
    position: row.position as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listCoupons(userId: string): Promise<Coupon[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("coupons")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  return (data ?? []).map(rowToCoupon);
}

/**
 * Cupons visíveis na página pública: só os ativos.
 *
 * Recebe `userId` em vez de `username` porque quem chama já resolveu o perfil
 * — pedir o username aqui obrigaria a buscar o mesmo perfil uma segunda vez. A
 * checagem de conta ativa fica com quem resolve o perfil, pela mesma razão.
 */
export async function listActiveCoupons(userId: string): Promise<Coupon[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("coupons")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("position", { ascending: true });
  return (data ?? []).map(rowToCoupon);
}

export async function createCoupon(
  userId: string,
  data: { storeName: string; category?: string | null; discountLabel: string; code?: string | null; url: string }
): Promise<Coupon> {
  const db: DB = getSupabase();
  // Maior posição, não contagem: depois de excluir um cupom do meio a contagem
  // colidiria com uma posição que ainda existe.
  const { data: existing } = await db
    .from("coupons")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = existing ? (existing.position as number) + 1 : 0;

  const { data: row } = await db
    .from("coupons")
    .insert({
      user_id: userId,
      store_name: data.storeName,
      category: data.category ?? null,
      discount_label: data.discountLabel,
      code: data.code ?? null,
      url: data.url,
      position,
    })
    .select()
    .single();
  return rowToCoupon(row);
}

export async function updateCoupon(
  id: string,
  userId: string,
  data: Partial<{ storeName: string; category: string | null; discountLabel: string; code: string | null; url: string; isActive: boolean }>
): Promise<Coupon | null> {
  const db: DB = getSupabase();
  const patch: Record<string, unknown> = {};
  if (data.storeName !== undefined) patch.store_name = data.storeName;
  if (data.category !== undefined) patch.category = data.category;
  if (data.discountLabel !== undefined) patch.discount_label = data.discountLabel;
  if (data.code !== undefined) patch.code = data.code;
  if (data.url !== undefined) patch.url = data.url;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  if (Object.keys(patch).length === 0) return null;

  const { data: row } = await db
    .from("coupons")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();
  return row ? rowToCoupon(row) : null;
}

export async function deleteCoupon(id: string, userId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("coupons").delete().eq("id", id).eq("user_id", userId);
}

export async function reorderCoupons(userId: string, orderedIds: string[]): Promise<void> {
  const db: DB = getSupabase();
  await Promise.all(
    orderedIds.map((id, i) =>
      db.from("coupons").update({ position: i }).eq("id", id).eq("user_id", userId)
    )
  );
}
