// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { getSupabase } from "./supabase";
// Cast db to any to avoid Supabase type errors without a generated schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export type IntegrationStatus =
  | "connected"
  | "pending_program_approval"
  | "error"
  | "disconnected";

export interface AwinIntegration {
  id: string;
  userId: string;
  provider: "awin";
  advertiserId: number;
  publisherId: string;
  encryptedToken: string;
  status: IntegrationStatus;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

type Row = {
  id: string;
  user_id: string;
  provider: string;
  advertiser_id: number;
  publisher_id: string;
  encrypted_token: string;
  status: string;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
};

function toModel(row: Row): AwinIntegration {
  return {
    id: row.id,
    userId: row.user_id,
    provider: "awin",
    advertiserId: row.advertiser_id,
    publisherId: row.publisher_id,
    encryptedToken: row.encrypted_token,
    status: row.status as IntegrationStatus,
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getIntegration(userId: string): Promise<AwinIntegration | null> {
  const db: DB = getSupabase();
  const { data, error } = await db
    .from("affiliate_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "awin")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toModel(data as Row);
}

export async function upsertIntegration(
  data: Omit<AwinIntegration, "id" | "createdAt" | "updatedAt">
): Promise<AwinIntegration> {
  const db: DB = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (db as any)
    .from("affiliate_integrations")
    .upsert(
      {
        user_id: data.userId,
        provider: data.provider,
        advertiser_id: data.advertiserId,
        publisher_id: data.publisherId,
        encrypted_token: data.encryptedToken,
        status: data.status,
        last_checked_at: data.lastCheckedAt,
      },
      { onConflict: "user_id,provider" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toModel(row as Row);
}

export async function updateIntegrationStatus(
  userId: string,
  status: IntegrationStatus
): Promise<void> {
  const db: DB = getSupabase();
  const { error } = await db
    .from("affiliate_integrations")
    .update({ status, last_checked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", "awin");

  if (error) throw new Error(error.message);
}

export async function deleteIntegration(userId: string): Promise<void> {
  const db: DB = getSupabase();
  const { error } = await db
    .from("affiliate_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "awin");

  if (error) throw new Error(error.message);
}
