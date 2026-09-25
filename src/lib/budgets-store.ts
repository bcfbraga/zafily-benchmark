import { getSupabase } from "./supabase";
import { generateSlug, getOrCreateProfile, getProfileByUsername, resolveCurrentUsername } from "./lives-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export { getOrCreateProfile, getProfileByUsername, resolveCurrentUsername };
export { SCOPE_DEFAULT_NOTES } from "./scope-defaults";

export interface ValuePoint {
  title: string;
  body: string;
}

export interface Budget {
  id: string;
  userId: string;
  title: string;
  slug: string;
  clientName: string | null;
  clientPhone: string | null;
  clientLogoUrl: string | null;
  finalValue: number | null;
  status: "draft" | "published";
  expiresAt: string | null;
  valueIntro: string | null;
  valuePoints: ValuePoint[] | null;
  valueHidden: boolean;
  conditions: string | null;
  conditionsHidden: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

const DEFAULT_VALIDITY_DAYS = 15;

function defaultExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + DEFAULT_VALIDITY_DAYS);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_VALUE_POINTS: ValuePoint[] = [
  { title: "Exposição Qualificada", body: "A marca aparece para uma audiência que já acompanha e confia na criadora." },
  { title: "Conteúdo Nativo", body: "A entrega é pensada para parecer conteúdo de rotina, não anúncio deslocado." },
  { title: "Associação de Imagem", body: "A marca se conecta à estética, credibilidade e estilo de vida da criadora." },
];

const DEFAULT_CONDITIONS = [
  "Prazo de produção: definido após aprovação do briefing",
  "Alterações: 1 rodada de ajustes inclusa",
  "Impulsionamento pago: não incluso",
  "Exclusividade de segmento: sob consulta",
].join("\n");

export interface BudgetItem {
  id: string;
  budgetId: string;
  description: string;
  quantity: number | null;
  notes: string | null;
  position: number;
  createdAt: string;
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export async function uniqueBudgetSlug(userId: string, base: string): Promise<string> {
  const db: DB = getSupabase();
  let slug = base;
  let i = 2;
  while (true) {
    const { data } = await db.from("budgets").select("id").eq("user_id", userId).eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

function rowToBudget(row: Record<string, unknown>, count?: number): Budget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    slug: row.slug as string,
    clientName: (row.client_name as string) ?? null,
    clientPhone: (row.client_phone as string) ?? null,
    clientLogoUrl: (row.client_logo_url as string) ?? null,
    finalValue: row.final_value != null ? Number(row.final_value) : null,
    status: row.status as "draft" | "published",
    expiresAt: (row.expires_at as string) ?? null,
    valueIntro: (row.value_intro as string) ?? null,
    valuePoints: (row.value_points as ValuePoint[]) ?? null,
    valueHidden: Boolean(row.value_hidden),
    conditions: (row.conditions as string) ?? null,
    conditionsHidden: Boolean(row.conditions_hidden),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    itemCount: count,
  };
}

export async function listBudgets(userId: string): Promise<Budget[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("budgets")
    .select("*, budget_items(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) => {
    const items = row.budget_items as Array<{ count: number }>;
    return rowToBudget(row, items?.[0]?.count ?? 0);
  });
}

export async function getBudget(id: string, userId: string): Promise<Budget | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("budgets").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return data ? rowToBudget(data) : null;
}

export async function getPublicBudget(username: string, slug: string): Promise<(Budget & { items: BudgetItem[] }) | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  if (profile.accountStatus !== "active") return null;

  const db: DB = getSupabase();
  const { data: budget } = await db
    .from("budgets")
    .select("*")
    .eq("user_id", profile.userId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!budget) return null;

  const { data: items } = await db
    .from("budget_items")
    .select("*")
    .eq("budget_id", budget.id)
    .order("position", { ascending: true });

  return { ...rowToBudget(budget), items: (items ?? []).map(rowToItem) };
}

export async function createBudget(
  userId: string,
  data: { title: string; clientName?: string; clientPhone?: string; clientLogoUrl?: string; finalValue?: number }
): Promise<Budget> {
  const db: DB = getSupabase();
  const base = generateSlug(data.title);
  const slug = await uniqueBudgetSlug(userId, base);

  const { data: row } = await db
    .from("budgets")
    .insert({
      user_id: userId,
      title: data.title,
      slug,
      client_name: data.clientName ?? null,
      client_phone: data.clientPhone ?? null,
      client_logo_url: data.clientLogoUrl ?? null,
      final_value: data.finalValue ?? null,
      status: "draft",
      expires_at: defaultExpiresAt(),
      value_points: DEFAULT_VALUE_POINTS,
      conditions: DEFAULT_CONDITIONS,
    })
    .select()
    .single();

  return rowToBudget(row);
}

export async function updateBudget(
  id: string,
  userId: string,
  data: {
    title?: string;
    clientName?: string | null;
    clientPhone?: string | null;
    clientLogoUrl?: string | null;
    finalValue?: number | null;
    status?: "draft" | "published";
    expiresAt?: string | null;
    valueIntro?: string | null;
    valuePoints?: ValuePoint[] | null;
    valueHidden?: boolean;
    conditions?: string | null;
    conditionsHidden?: boolean;
  }
): Promise<Budget> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("budgets")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.clientName !== undefined && { client_name: data.clientName }),
      ...(data.clientPhone !== undefined && { client_phone: data.clientPhone }),
      ...(data.clientLogoUrl !== undefined && { client_logo_url: data.clientLogoUrl }),
      ...(data.finalValue !== undefined && { final_value: data.finalValue }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.expiresAt !== undefined && { expires_at: data.expiresAt }),
      ...(data.valueIntro !== undefined && { value_intro: data.valueIntro }),
      ...(data.valuePoints !== undefined && { value_points: data.valuePoints }),
      ...(data.valueHidden !== undefined && { value_hidden: data.valueHidden }),
      ...(data.conditions !== undefined && { conditions: data.conditions }),
      ...(data.conditionsHidden !== undefined && { conditions_hidden: data.conditionsHidden }),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  return rowToBudget(row);
}

export async function deleteBudget(id: string, userId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("budgets").delete().eq("id", id).eq("user_id", userId);
}

// ─── Items ────────────────────────────────────────────────────────────────────

function rowToItem(row: Record<string, unknown>): BudgetItem {
  return {
    id: row.id as string,
    budgetId: row.budget_id as string,
    description: row.description as string,
    quantity: row.quantity != null ? Number(row.quantity) : null,
    notes: (row.notes as string) ?? null,
    position: row.position as number,
    createdAt: row.created_at as string,
  };
}

export async function listItems(budgetId: string): Promise<BudgetItem[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("budget_items")
    .select("*")
    .eq("budget_id", budgetId)
    .order("position", { ascending: true });
  return (data ?? []).map(rowToItem);
}

export async function countItems(budgetId: string): Promise<number> {
  const db: DB = getSupabase();
  const { count } = await db.from("budget_items").select("*", { count: "exact", head: true }).eq("budget_id", budgetId);
  return count ?? 0;
}

export async function addItem(
  budgetId: string,
  data: { description: string; quantity?: number | null; notes?: string | null }
): Promise<BudgetItem> {
  const db: DB = getSupabase();
  const position = await countItems(budgetId);
  const { data: row } = await db
    .from("budget_items")
    .insert({
      budget_id: budgetId,
      description: data.description,
      quantity: data.quantity ?? null,
      notes: data.notes ?? null,
      position,
    })
    .select()
    .single();
  return rowToItem(row);
}

export async function updateItem(
  id: string,
  budgetId: string,
  data: { description?: string; quantity?: number | null; notes?: string | null }
): Promise<BudgetItem> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("budget_items")
    .update({
      ...(data.description !== undefined && { description: data.description }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .eq("id", id)
    .eq("budget_id", budgetId)
    .select()
    .single();
  return rowToItem(row);
}

export async function deleteItem(id: string, budgetId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("budget_items").delete().eq("id", id).eq("budget_id", budgetId);
}

export async function reorderItems(budgetId: string, order: string[]): Promise<void> {
  const db: DB = getSupabase();
  await Promise.all(
    order.map((id, position) =>
      db.from("budget_items").update({ position }).eq("id", id).eq("budget_id", budgetId)
    )
  );
}
