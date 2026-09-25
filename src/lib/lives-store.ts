import { getSupabase } from "./supabase";
import type { ImportStatus } from "./metadata";
import { isAdminEmail } from "./admin";
import { getApprovedRequestByEmail, markInviteConsumed } from "./access-requests-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export class AccessNotApprovedError extends Error {
  constructor() {
    super("Access not approved for this email");
    this.name = "AccessNotApprovedError";
  }
}

export interface Live {
  id: string;
  userId: string;
  title: string;
  slug: string;
  liveDate: string | null;
  liveTime: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  store: string | null;
  discount: number | null;
  discountType: "cart" | "coupon";
  couponCode: string | null;
  sectionId: string | null;
  showPrices: boolean;
  showTitle: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  thumbnails?: string[];
  previewProducts?: PreviewProduct[];
  views?: number;
  clicks?: number;
}

export interface PreviewProduct {
  id: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
}

export interface VitrineSection {
  id: string;
  userId: string;
  name: string;
  position: number;
  createdAt: string;
}

export interface LiveProduct {
  id: string;
  liveId: string;
  url: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  category: string | null;
  size: string | null;
  productUrl: string | null;
  position: number;
  createdAt: string;
  clicks?: number;
  /** Resultado da busca do link. `null` em produtos anteriores à migration 033. */
  importStatus: ImportStatus | null;
  importError: string | null;
}

export interface SocialLink {
  /**
   * Identificador da rede. Aberto de propósito: o dashboard oferece as cinco
   * com ícone próprio, mas qualquer outra pode ser gravada e a página pública
   * a desenha com o ícone genérico.
   */
  platform: string;
  url: string;
}

export interface DesignSettings {
  theme: string;
  header: string;
  wallpaper: string;
  buttons: string;
  text: string;
  colors: string;
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  theme: "Custom",
  header: "Classic",
  wallpaper: "Gradient",
  buttons: "Glass",
  text: "Poppins, Link Sans",
  colors: "Marsala",
};

export type AccountStatus = "draft" | "pending_activation" | "active" | "suspended";

export interface Profile {
  userId: string;
  username: string;
  displayName: string | null;
  instagramHandle: string | null;
  location: string | null;
  followersLabel: string | null;
  reachLabel: string | null;
  viewsLabel: string | null;
  engagementLabel: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  linkUrl: string | null;
  photoUrl: string | null;
  roleTitle: string | null;
  bio: string | null;
  socialLinks: SocialLink[];
  designSettings: DesignSettings;
  accountStatus: AccountStatus;
  mainGoal: string | null;
  platformsUsed: string | null;
  onboardedAt: string | null;
  plan: string | null;
  planExpiresAt: string | null;
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function uniqueSlug(userId: string, base: string): Promise<string> {
  const db: DB = getSupabase();
  let slug = base;
  let i = 2;
  while (true) {
    const { data } = await db.from("lives").select("id").eq("user_id", userId).eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    userId: row.user_id as string,
    username: row.username as string,
    displayName: (row.display_name as string) ?? null,
    instagramHandle: (row.instagram_handle as string) ?? null,
    location: (row.location as string) ?? null,
    followersLabel: (row.followers_label as string) ?? null,
    reachLabel: (row.reach_label as string) ?? null,
    viewsLabel: (row.views_label as string) ?? null,
    engagementLabel: (row.engagement_label as string) ?? null,
    whatsapp: (row.whatsapp as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    linkUrl: (row.link_url as string) ?? null,
    photoUrl: (row.photo_url as string) ?? null,
    roleTitle: (row.role_title as string) ?? null,
    bio: (row.bio as string) ?? null,
    socialLinks: (row.social_links as SocialLink[]) ?? [],
    designSettings: { ...DEFAULT_DESIGN_SETTINGS, ...((row.design_settings as Partial<DesignSettings>) ?? {}) },
    accountStatus: effectiveAccountStatus(row),
    mainGoal: (row.main_goal as string) ?? null,
    platformsUsed: (row.platforms_used as string) ?? null,
    onboardedAt: (row.onboarded_at as string) ?? null,
    plan: (row.plan as string) ?? null,
    planExpiresAt: (row.plan_expires_at as string) ?? null,
  };
}

export async function getOrCreateProfile(userId: string, email: string): Promise<Profile> {
  const db: DB = getSupabase();
  const { data } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (data) return rowToProfile(data);

  if (!isAdminEmail(email)) {
    const approved = await getApprovedRequestByEmail(email);
    if (!approved) throw new AccessNotApprovedError();
  }

  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  let username = base;
  let i = 2;
  while (true) {
    const { data: existing } = await db.from("profiles").select("user_id").eq("username", username).maybeSingle();
    if (!existing) break;
    username = `${base}${i++}`;
  }

  const { data: created } = await db
    .from("profiles")
    .insert({ user_id: userId, username, display_name: null, plan: "Teste grátis" })
    .select()
    .single();

  await markInviteConsumed(email);

  return rowToProfile(created);
}

/**
 * Status efetivo da conta: um plano válido libera a conta.
 *
 * Antes, `account_status` e o plano eram independentes — dava para ter Creator
 * Elite pago e continuar sem conseguir publicar, e nada no app colocava o
 * status em "active" (as contas ativas tinham sido mudadas à mão no banco).
 *
 * Duas garantias que a regra precisa respeitar:
 *  - `suspended` continua bloqueando, mesmo com plano em dia. Suspensão é
 *    decisão de moderação e não pode ser desfeita por pagamento.
 *  - quem já está "active" segue ativo mesmo sem plano registrado, senão as
 *    contas internas (sem plano preenchido) perderiam acesso.
 */
export function effectiveAccountStatus(row: {
  account_status?: unknown;
  plan?: unknown;
  plan_expires_at?: unknown;
}): AccountStatus {
  const armazenado = (row.account_status as AccountStatus) ?? "draft";
  if (armazenado === "suspended" || armazenado === "active") return armazenado;

  const plano = typeof row.plan === "string" ? row.plan.trim() : "";
  if (!plano) return armazenado;

  // A validade é obrigatória, e é ela que separa plano contratado de teste.
  // Toda conta nova nasce com "Teste grátis" e sem validade; aceitar plano sem
  // data liberaria publicação para qualquer cadastro e derrubaria o portão.
  if (!row.plan_expires_at) return armazenado;

  const expira = new Date(row.plan_expires_at as string);
  return expira.getTime() >= Date.now() ? "active" : armazenado;
}

export async function getAccountStatus(userId: string): Promise<AccountStatus> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("profiles")
    .select("account_status, plan, plan_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? effectiveAccountStatus(data) : "draft";
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string | null;
    instagramHandle?: string | null;
    location?: string | null;
    followersLabel?: string | null;
    reachLabel?: string | null;
    viewsLabel?: string | null;
    engagementLabel?: string | null;
    whatsapp?: string | null;
    contactEmail?: string | null;
    linkUrl?: string | null;
    photoUrl?: string | null;
    roleTitle?: string | null;
    bio?: string | null;
    socialLinks?: SocialLink[];
    designSettings?: DesignSettings;
    accountStatus?: AccountStatus;
    mainGoal?: string | null;
    platformsUsed?: string | null;
    onboardedAt?: string | null;
    plan?: string | null;
    planExpiresAt?: string | null;
  }
): Promise<Profile> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("profiles")
    .update({
      ...(data.displayName !== undefined && { display_name: data.displayName }),
      ...(data.instagramHandle !== undefined && { instagram_handle: data.instagramHandle }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.followersLabel !== undefined && { followers_label: data.followersLabel }),
      ...(data.reachLabel !== undefined && { reach_label: data.reachLabel }),
      ...(data.viewsLabel !== undefined && { views_label: data.viewsLabel }),
      ...(data.engagementLabel !== undefined && { engagement_label: data.engagementLabel }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
      ...(data.contactEmail !== undefined && { contact_email: data.contactEmail }),
      ...(data.linkUrl !== undefined && { link_url: data.linkUrl }),
      ...(data.photoUrl !== undefined && { photo_url: data.photoUrl }),
      ...(data.roleTitle !== undefined && { role_title: data.roleTitle }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.socialLinks !== undefined && { social_links: data.socialLinks }),
      ...(data.designSettings !== undefined && { design_settings: data.designSettings }),
      ...(data.accountStatus !== undefined && { account_status: data.accountStatus }),
      ...(data.mainGoal !== undefined && { main_goal: data.mainGoal }),
      ...(data.platformsUsed !== undefined && { platforms_used: data.platformsUsed }),
      ...(data.onboardedAt !== undefined && { onboarded_at: data.onboardedAt }),
      ...(data.plan !== undefined && { plan: data.plan }),
      ...(data.planExpiresAt !== undefined && { plan_expires_at: data.planExpiresAt }),
    })
    .eq("user_id", userId)
    .select()
    .single();

  return rowToProfile(row);
}

export async function updateUsername(
  userId: string,
  rawUsername: string
): Promise<{ ok: true; profile: Profile } | { ok: false; error: string }> {
  const username = rawUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
  if (username.length < 3) {
    return { ok: false, error: "Nome de usuário precisa ter ao menos 3 caracteres" };
  }

  const db: DB = getSupabase();
  const { data: existing } = await db.from("profiles").select("user_id").eq("username", username).maybeSingle();
  if (existing && existing.user_id !== userId) {
    return { ok: false, error: "Este nome de usuário já está em uso" };
  }

  const { data: current } = await db.from("profiles").select("username").eq("user_id", userId).maybeSingle();
  const oldUsername = current?.username as string | undefined;

  if (oldUsername && oldUsername !== username) {
    // The new username may have belonged to someone else historically — that
    // record should no longer redirect here now that it's actively claimed.
    await db.from("username_history").delete().eq("old_username", username);
    await db.from("username_history").upsert({ old_username: oldUsername, user_id: userId, changed_at: new Date().toISOString() });
  }

  const { data: row } = await db.from("profiles").update({ username }).eq("user_id", userId).select().single();
  return { ok: true, profile: rowToProfile(row) };
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!data) return null;
  return rowToProfile(data);
}

export async function resolveCurrentUsername(oldUsername: string): Promise<string | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("username_history").select("user_id").eq("old_username", oldUsername).maybeSingle();
  if (!data) return null;
  const { data: profile } = await db.from("profiles").select("username").eq("user_id", data.user_id).maybeSingle();
  return (profile?.username as string) ?? null;
}

// ─── Vitrine sections ───────────────────────────────────────────────────────

export async function listSections(userId: string): Promise<VitrineSection[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("vitrine_sections")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  return (data ?? []).map(rowToSection);
}

export async function createSection(userId: string, name: string): Promise<VitrineSection> {
  const db: DB = getSupabase();
  const { data: existing } = await db
    .from("vitrine_sections")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = existing ? (existing.position as number) + 1 : 0;

  const { data: row } = await db
    .from("vitrine_sections")
    .insert({ user_id: userId, name, position })
    .select()
    .single();
  return rowToSection(row);
}

export async function renameSection(id: string, userId: string, name: string): Promise<VitrineSection> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("vitrine_sections")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return rowToSection(row);
}

export async function deleteSection(id: string, userId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("vitrine_sections").delete().eq("id", id).eq("user_id", userId);
}

export async function reorderSections(userId: string, order: string[]): Promise<void> {
  const db: DB = getSupabase();
  await Promise.all(
    order.map((id, position) =>
      db.from("vitrine_sections").update({ position }).eq("id", id).eq("user_id", userId)
    )
  );
}

// ─── Lives ────────────────────────────────────────────────────────────────────

function rowToLive(row: Record<string, unknown>, count?: number): Live {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    slug: row.slug as string,
    liveDate: (row.live_date as string) ?? null,
    liveTime: (row.live_time as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    status: row.status as "draft" | "published",
    store: (row.store as string) ?? null,
    discount: (row.discount as number) ?? null,
    discountType: (row.discount_type as "cart" | "coupon") ?? "cart",
    couponCode: (row.coupon_code as string) ?? null,
    sectionId: (row.section_id as string) ?? null,
    showPrices: (row.show_prices as boolean) ?? true,
    showTitle: (row.show_title as boolean) ?? true,
    position: (row.position as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    productCount: count,
  };
}

function rowToSection(row: Record<string, unknown>): VitrineSection {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    position: row.position as number,
    createdAt: row.created_at as string,
  };
}

export async function listPublishedLivesByUsername(username: string): Promise<{ profile: Profile; lives: Live[] } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const db: DB = getSupabase();
  const { data } = await db
    .from("lives")
    .select("*, live_products(count)")
    .eq("user_id", profile.userId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const lives = (data ?? []).map((row: Record<string, unknown>) => {
    const products = row.live_products as Array<{ count: number }>;
    return rowToLive(row, products?.[0]?.count ?? 0);
  });

  return { profile, lives };
}

export async function getPublicGallery(
  username: string
): Promise<{ profile: Profile; sections: VitrineSection[]; lives: Live[] } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  if (profile.accountStatus !== "active") return null;

  const [{ data }, sections] = await Promise.all([
    getSupabase()
      .from("lives")
      .select("*, live_products(count)")
      .eq("user_id", profile.userId)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    listSections(profile.userId),
  ]);

  const lives = (data ?? []).map((row: Record<string, unknown>) => {
    const products = row.live_products as Array<{ count: number }>;
    return rowToLive(row, products?.[0]?.count ?? 0);
  });

  const liveIds = lives.map(l => l.id);
  if (liveIds.length > 0) {
    const db: DB = getSupabase();
    const { data: productRows } = await db
      .from("live_products")
      .select("id, live_id, image_url, name, price, position")
      .in("live_id", liveIds)
      .order("position", { ascending: true });

    const previewsByLive = new Map<string, PreviewProduct[]>();
    for (const row of (productRows ?? []) as Array<{ id: string; live_id: string; image_url: string | null; name: string | null; price: string | null }>) {
      const list = previewsByLive.get(row.live_id) ?? [];
      if (list.length < 5) {
        list.push({ id: row.id, name: row.name, imageUrl: row.image_url, price: row.price });
        previewsByLive.set(row.live_id, list);
      }
    }
    for (const l of lives) l.previewProducts = previewsByLive.get(l.id) ?? [];
  }

  return { profile, sections, lives };
}

/**
 * Uma ida ao banco em vez de três.
 *
 * Antes eram três consultas sequenciais (lives, live_products, RPCs de
 * contagem). A função roda em iad1 e o banco está em São Paulo, então cada ida
 * custa ~200ms de travessia, enquanto o trabalho no banco leva milissegundos —
 * o gargalo era a distância, não a query. A RPC dashboard_lives devolve tudo
 * agregado de uma vez; a equivalência com o cálculo anterior foi conferida
 * campo a campo antes da troca.
 */
export async function listLives(userId: string): Promise<Live[]> {
  const db: DB = getSupabase();
  const { data } = await db.rpc("dashboard_lives", { p_user_id: userId });

  return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({
    ...rowToLive(row, Number(row.product_count ?? 0)),
    thumbnails: (row.thumbnails as string[]) ?? [],
    previewProducts: ((row.preview_products as Array<Record<string, unknown>>) ?? []).map(p => ({
      id: p.id as string,
      name: (p.name as string) ?? null,
      imageUrl: (p.image_url as string) ?? null,
      price: (p.price as string) ?? null,
    })),
    clicks: Number(row.clicks ?? 0),
    views: Number(row.views ?? 0),
  }));
}

export async function reorderLives(userId: string, order: string[]): Promise<void> {
  const db: DB = getSupabase();
  await Promise.all(
    order.map((id, position) =>
      db.from("lives").update({ position }).eq("id", id).eq("user_id", userId)
    )
  );
}

export async function getLive(id: string, userId: string): Promise<Live | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("lives").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return data ? rowToLive(data) : null;
}

export interface ProductClickStat {
  id: string;
  name: string | null;
  imageUrl: string | null;
  price: string | null;
  clicks: number;
}

export interface LivePerformance {
  live: Live;
  views: number;
  products: ProductClickStat[];
  clickTimestamps: string[];
}

export async function getLivePerformance(id: string, userId: string): Promise<LivePerformance | null> {
  const live = await getLive(id, userId);
  if (!live) return null;

  const db: DB = getSupabase();
  const [{ data: products }, { data: impressionRows }] = await Promise.all([
    db.from("live_products").select("id, name, image_url, price").eq("live_id", id).order("position", { ascending: true }),
    db.rpc("live_impression_counts", { p_live_ids: [id] }),
  ]);
  const viewCount = Number((impressionRows ?? [])[0]?.count ?? 0);

  const productIds = (products ?? []).map((p: Record<string, unknown>) => p.id as string);

  // Raw timestamps are needed for the click timeline, so they can't be
  // replaced by an aggregate — fetch them a page at a time instead, since a
  // single `.select()` silently truncates at PostgREST's row cap once a
  // popular live passes ~1000 clicks.
  const clickRows: Array<{ product_id: string; created_at: string }> = [];
  if (productIds.length > 0) {
    const PAGE_SIZE = 1000;
    const MAX_PAGES = 100; // 100k clicks safety ceiling — well beyond any real live
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data } = await db
        .from("product_clicks")
        .select("product_id, created_at")
        .in("product_id", productIds)
        .order("created_at", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const rows = (data ?? []) as Array<{ product_id: string; created_at: string }>;
      if (rows.length === 0) break;
      clickRows.push(...rows);
    }
  }

  // Per-product totals are aggregated in Postgres so they stay accurate
  // regardless of how many raw click rows exist.
  const { data: clickCounts } = productIds.length > 0
    ? await db.rpc("product_click_counts", { p_product_ids: productIds })
    : { data: [] as { product_id: string; count: number }[] };
  const clicksByProduct = new Map<string, number>();
  for (const row of (clickCounts ?? []) as Array<{ product_id: string; count: number }>) {
    clicksByProduct.set(row.product_id, Number(row.count));
  }

  const productStats: ProductClickStat[] = (products ?? [])
    .map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: (p.name as string) ?? null,
      imageUrl: (p.image_url as string) ?? null,
      price: (p.price as string) ?? null,
      clicks: clicksByProduct.get(p.id as string) ?? 0,
    }))
    .sort((a: ProductClickStat, b: ProductClickStat) => b.clicks - a.clicks);

  return {
    live,
    views: viewCount ?? 0,
    products: productStats,
    clickTimestamps: clickRows.map(r => r.created_at),
  };
}

export async function getPublicLive(username: string, slug: string): Promise<(Live & { products: LiveProduct[] }) | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  if (profile.accountStatus !== "active") return null;

  const db: DB = getSupabase();
  const { data: live } = await db
    .from("lives")
    .select("*")
    .eq("user_id", profile.userId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!live) return null;

  const { data: products } = await db
    .from("live_products")
    .select("*")
    .eq("live_id", live.id)
    .order("position", { ascending: true });

  return { ...rowToLive(live), products: (products ?? []).map(rowToProduct) };
}

export async function createLive(
  userId: string,
  data: { title: string; liveDate?: string; liveTime?: string; imageUrl?: string; store?: string; sectionId?: string | null; discount?: number | null; discountType?: "cart" | "coupon"; couponCode?: string | null; showPrices?: boolean; showTitle?: boolean }
): Promise<Live> {
  const db: DB = getSupabase();
  const base = generateSlug(data.title);
  const slug = await uniqueSlug(userId, base);

  const { data: existing } = await db
    .from("lives")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = existing ? (existing.position as number) + 1 : 0;

  const { data: row } = await db
    .from("lives")
    .insert({
      user_id: userId,
      title: data.title,
      slug,
      live_date: data.liveDate ?? null,
      live_time: data.liveTime ?? null,
      image_url: data.imageUrl ?? null,
      store: data.store ?? null,
      section_id: data.sectionId ?? null,
      discount: data.discount ?? null,
      discount_type: data.discountType ?? "cart",
      coupon_code: data.couponCode ?? null,
      show_prices: data.showPrices ?? true,
      show_title: data.showTitle ?? true,
      position,
      status: "draft",
    })
    .select()
    .single();

  return rowToLive(row);
}

export async function updateLive(
  id: string,
  userId: string,
  data: { title?: string; liveDate?: string | null; liveTime?: string | null; imageUrl?: string | null; status?: "draft" | "published"; store?: string | null; discount?: number | null; discountType?: "cart" | "coupon"; couponCode?: string | null; sectionId?: string | null; showPrices?: boolean; showTitle?: boolean }
): Promise<Live> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("lives")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.liveDate !== undefined && { live_date: data.liveDate }),
      ...(data.liveTime !== undefined && { live_time: data.liveTime }),
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.store !== undefined && { store: data.store }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.discountType !== undefined && { discount_type: data.discountType }),
      ...(data.couponCode !== undefined && { coupon_code: data.couponCode }),
      ...(data.sectionId !== undefined && { section_id: data.sectionId }),
      ...(data.showPrices !== undefined && { show_prices: data.showPrices }),
      ...(data.showTitle !== undefined && { show_title: data.showTitle }),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  return rowToLive(row);
}

export async function updateLiveSlug(
  id: string,
  userId: string,
  rawSlug: string
): Promise<{ ok: true; live: Live } | { ok: false; error: string }> {
  const slug = generateSlug(rawSlug);
  if (slug.length < 3) {
    return { ok: false, error: "Link precisa ter ao menos 3 caracteres" };
  }

  const db: DB = getSupabase();
  const { data: existing } = await db.from("lives").select("id").eq("user_id", userId).eq("slug", slug).maybeSingle();
  if (existing && existing.id !== id) {
    return { ok: false, error: "Já existe uma vitrine sua com esse link" };
  }

  const { data: current } = await db.from("lives").select("slug").eq("id", id).eq("user_id", userId).maybeSingle();
  const oldSlug = current?.slug as string | undefined;

  if (oldSlug && oldSlug !== slug) {
    await db.from("live_slug_history").delete().eq("live_id", id).eq("old_slug", slug);
    await db.from("live_slug_history").upsert({ live_id: id, old_slug: oldSlug, changed_at: new Date().toISOString() });
  }

  const { data: row } = await db.from("lives").update({ slug }).eq("id", id).eq("user_id", userId).select().single();
  return { ok: true, live: rowToLive(row) };
}

export async function resolveCurrentSlug(userId: string, oldSlug: string): Promise<string | null> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("live_slug_history")
    .select("live_id, lives!inner(user_id, slug)")
    .eq("old_slug", oldSlug)
    .eq("lives.user_id", userId)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.lives as any)?.slug ?? null;
}

export async function deleteLive(id: string, userId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("lives").delete().eq("id", id).eq("user_id", userId);
}

// ─── Products ─────────────────────────────────────────────────────────────────

function rowToProduct(row: Record<string, unknown>): LiveProduct {
  return {
    id: row.id as string,
    liveId: row.live_id as string,
    url: row.url as string,
    name: (row.name as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    price: (row.price as string) ?? null,
    category: (row.category as string) ?? null,
    size: (row.size as string) ?? null,
    productUrl: (row.product_url as string) ?? null,
    position: row.position as number,
    createdAt: row.created_at as string,
    importStatus: (row.import_status as ImportStatus) ?? null,
    importError: (row.import_error as string) ?? null,
  };
}

export async function listProducts(liveId: string): Promise<LiveProduct[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("live_products")
    .select("*")
    .eq("live_id", liveId)
    .order("position", { ascending: true });
  const products = (data ?? []).map(rowToProduct);

  const productIds = products.map((p: LiveProduct) => p.id);
  if (productIds.length === 0) return products;

  const { data: clickRows } = await db.from("product_clicks").select("product_id").in("product_id", productIds);
  const clicksByProduct = new Map<string, number>();
  for (const row of (clickRows ?? []) as Array<{ product_id: string }>) {
    clicksByProduct.set(row.product_id, (clicksByProduct.get(row.product_id) ?? 0) + 1);
  }

  return products.map((p: LiveProduct) => ({ ...p, clicks: clicksByProduct.get(p.id) ?? 0 }));
}

/**
 * Identidade dos produtos já na vitrine, para barrar duplicados na importação.
 * Traz só as três colunas usadas na comparação — a lista completa passaria pela
 * contagem de cliques, que aqui não serve para nada.
 */
export async function existingProductKeys(
  liveId: string
): Promise<{ url: string; productUrl: string | null; size: string | null }[]> {
  const db: DB = getSupabase();
  const { data } = await db.from("live_products").select("url, product_url, size").eq("live_id", liveId);
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    url: row.url as string,
    productUrl: (row.product_url as string) ?? null,
    size: (row.size as string) ?? null,
  }));
}

/**
 * Posição para o próximo produto da vitrine. Usa o maior `position` em vez da
 * contagem porque, depois de excluir um produto do meio, a contagem colidiria
 * com uma posição que ainda existe.
 */
export async function nextProductPosition(liveId: string): Promise<number> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("live_products")
    .select("position")
    .eq("live_id", liveId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? (data.position as number) + 1 : 0;
}

export async function countProducts(liveId: string): Promise<number> {
  const db: DB = getSupabase();
  const { count } = await db.from("live_products").select("*", { count: "exact", head: true }).eq("live_id", liveId);
  return count ?? 0;
}

export async function addProduct(
  liveId: string,
  data: { url: string; name?: string | null; imageUrl?: string | null; price?: string | null; category?: string | null; productUrl?: string | null; size?: string | null; position: number; importStatus?: ImportStatus | null; importError?: string | null }
): Promise<LiveProduct> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("live_products")
    .insert({
      live_id: liveId,
      url: data.url,
      name: data.name ?? null,
      image_url: data.imageUrl ?? null,
      price: data.price ?? null,
      category: data.category ?? null,
      product_url: data.productUrl ?? null,
      size: data.size ?? null,
      position: data.position,
      import_status: data.importStatus ?? null,
      import_error: data.importError ?? null,
    })
    .select()
    .single();
  return rowToProduct(row);
}

export async function deleteProduct(id: string, liveId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("live_products").delete().eq("id", id).eq("live_id", liveId);
}

// ─── Click / view tracking ──────────────────────────────────────────────────

export async function getProductUrl(productId: string): Promise<string | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("live_products").select("url").eq("id", productId).maybeSingle();
  return (data?.url as string) ?? null;
}

export async function recordProductClick(productId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("product_clicks").insert({ product_id: productId });
}

/**
 * Registra a exibição das vitrines mostradas num carregamento — tanto a página
 * da vitrine quanto a listagem, que é de onde saem os cliques do carrossel.
 * Contar só a página da vitrine deixava o denominador menor que o número de
 * cliques e o painel exibia CTR acima de 100%.
 */
export async function recordImpressions(liveIds: string[]): Promise<void> {
  if (liveIds.length === 0) return;
  const db: DB = getSupabase();
  await db.rpc("bump_live_impressions", { p_live_ids: liveIds });
}
