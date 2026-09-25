import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

function getAdminAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export interface ManagedUser {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  username: string | null;
  accountStatus: string | null;
  plan: string | null;
  planExpiresAt: string | null;
  liveCount: number;
  activeLiveCount: number;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const auth = getAdminAuthClient();
  const { data, error } = await auth.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;

  const db: DB = getSupabase();
  const [{ data: profiles }, { data: lives }] = await Promise.all([
    db.from("profiles").select("user_id, username, account_status, plan, plan_expires_at"),
    db.from("lives").select("user_id, status"),
  ]);

  const profileByUserId = new Map<
    string,
    { username: string; account_status: string; plan: string | null; plan_expires_at: string | null }
  >((profiles ?? []).map((p: { user_id: string; username: string; account_status: string; plan: string | null; plan_expires_at: string | null }) => [p.user_id, p]));

  const liveCounts = new Map<string, { total: number; active: number }>();
  for (const l of (lives ?? []) as Array<{ user_id: string; status: string }>) {
    const counts = liveCounts.get(l.user_id) ?? { total: 0, active: 0 };
    counts.total += 1;
    if (l.status === "published") counts.active += 1;
    liveCounts.set(l.user_id, counts);
  }

  return data.users
    .map(u => {
      const profile = profileByUserId.get(u.id);
      const counts = liveCounts.get(u.id) ?? { total: 0, active: 0 };
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        emailConfirmedAt: u.email_confirmed_at ?? null,
        bannedUntil: u.banned_until ?? null,
        username: profile?.username ?? null,
        accountStatus: profile?.account_status ?? null,
        plan: profile?.plan ?? null,
        planExpiresAt: profile?.plan_expires_at ?? null,
        liveCount: counts.total,
        activeLiveCount: counts.active,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const b64 = Buffer.from(bytes).toString("base64").replace(/[+/=]/g, "");
  return `${b64.slice(0, 12)}!Az9`;
}

export interface CreatedUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Cria uma conta direto pelo admin, sem passar pelo fluxo de solicitar acesso.
 *
 * Dois passos são obrigatórios juntos: além do usuário no auth, é preciso
 * deixar uma solicitação **aprovada** para o e-mail. `getOrCreateProfile`
 * barra quem não tem uma, então criar só o usuário deixaria a pessoa trancada
 * no primeiro login, sem perfil e sem mensagem útil.
 *
 * O e-mail já entra confirmado: quem cria é o admin, então não faz sentido
 * exigir o passo de confirmação.
 */
export async function createManagedUser(email: string, name: string): Promise<CreatedUser> {
  const auth = getAdminAuthClient();
  const password = generatePassword();

  const { data, error } = await auth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const db: DB = getSupabase();
  const { data: existing } = await db
    .from("access_requests")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const approved = {
    status: "approved",
    invite_token: crypto.randomUUID(),
    reviewed_at: new Date().toISOString(),
  };

  if (existing) {
    // Já havia pedido para este e-mail: aprova em vez de duplicar
    await db.from("access_requests").update(approved).eq("id", existing.id);
  } else {
    await db.from("access_requests").insert({ name, email, ...approved });
  }

  return { id: data.user!.id, email, password };
}

export async function resetUserPassword(userId: string): Promise<string> {
  const auth = getAdminAuthClient();
  const password = generatePassword();
  const { error } = await auth.auth.admin.updateUserById(userId, { password });
  if (error) throw error;
  return password;
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  const auth = getAdminAuthClient();
  const { error } = await auth.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
  if (error) throw error;
}

async function deleteUserStorage(userId: string): Promise<void> {
  const db: DB = getSupabase();
  for (const bucket of ["live-images", "link-images"]) {
    try {
      const { data: files } = await db.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
        await db.storage.from(bucket).remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
      }
    } catch {
      // Storage cleanup is best-effort — a failure here shouldn't block account deletion.
    }
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const db: DB = getSupabase();

  // Cascading FKs handle the rest (live_products/live_views/product_clicks via lives,
  // budget_items via budgets, link_clicks via links, username_history via profiles).
  await db.from("lives").delete().eq("user_id", userId);
  await db.from("budgets").delete().eq("user_id", userId);
  await db.from("links").delete().eq("user_id", userId);
  await db.from("vitrine_sections").delete().eq("user_id", userId);
  await db.from("affiliate_integrations").delete().eq("user_id", userId);
  await db.from("affiliate_products").delete().eq("user_id", userId);
  await db.from("profiles").delete().eq("user_id", userId);

  await deleteUserStorage(userId);

  const auth = getAdminAuthClient();
  const { error } = await auth.auth.admin.deleteUser(userId);
  if (error) throw error;
}
