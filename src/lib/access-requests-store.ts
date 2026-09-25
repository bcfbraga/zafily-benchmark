import { getSupabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequestInput {
  name: string;
  email: string;
  socialHandle?: string | null;
  followersRange?: string | null;
  platforms?: string | null;
  currentDelivery?: string | null;
  biggestDifficulty?: string | null;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  socialHandle: string | null;
  followersRange: string | null;
  platforms: string | null;
  currentDelivery: string | null;
  biggestDifficulty: string | null;
  status: AccessRequestStatus;
  inviteToken: string | null;
  inviteTokenUsedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

function rowToRequest(row: Record<string, unknown>): AccessRequest {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    socialHandle: (row.social_handle as string) ?? null,
    followersRange: (row.followers_range as string) ?? null,
    platforms: (row.platforms as string) ?? null,
    currentDelivery: (row.current_delivery as string) ?? null,
    biggestDifficulty: (row.biggest_difficulty as string) ?? null,
    status: row.status as AccessRequestStatus,
    inviteToken: (row.invite_token as string) ?? null,
    inviteTokenUsedAt: (row.invite_token_used_at as string) ?? null,
    reviewedAt: (row.reviewed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function createAccessRequest(data: AccessRequestInput): Promise<void> {
  const db: DB = getSupabase();
  await db.from("access_requests").insert({
    name: data.name,
    email: data.email,
    social_handle: data.socialHandle ?? null,
    followers_range: data.followersRange ?? null,
    platforms: data.platforms ?? null,
    current_delivery: data.currentDelivery ?? null,
    biggest_difficulty: data.biggestDifficulty ?? null,
  });
}

export async function listAccessRequests(): Promise<AccessRequest[]> {
  const db: DB = getSupabase();
  const { data } = await db.from("access_requests").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(rowToRequest);
}

export async function approveAccessRequest(id: string): Promise<AccessRequest> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("access_requests")
    .update({ status: "approved", invite_token: crypto.randomUUID(), reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return rowToRequest(row);
}

export async function rejectAccessRequest(id: string): Promise<AccessRequest> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("access_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return rowToRequest(row);
}

export async function getApprovedRequestByEmail(email: string): Promise<AccessRequest | null> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("access_requests")
    .select("*")
    .eq("email", email)
    .eq("status", "approved")
    .maybeSingle();
  return data ? rowToRequest(data) : null;
}

export async function validateInviteToken(token: string): Promise<{ name: string; email: string } | null> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("access_requests")
    .select("name, email")
    .eq("invite_token", token)
    .eq("status", "approved")
    .is("invite_token_used_at", null)
    .maybeSingle();
  return data ? { name: data.name as string, email: data.email as string } : null;
}

export async function markInviteConsumed(email: string): Promise<void> {
  const db: DB = getSupabase();
  await db
    .from("access_requests")
    .update({ invite_token_used_at: new Date().toISOString() })
    .eq("email", email)
    .eq("status", "approved")
    .is("invite_token_used_at", null);
}
