import { getSupabase } from "./supabase";
import { getProfileByUsername, type Profile } from "./lives-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

export type TileSize = "1x1" | "2x1" | "1x2" | "2x2";

export interface LinkTile {
  id: string;
  userId: string;
  title: string;
  url: string;
  imageUrl: string | null;
  tileSize: TileSize;
  position: number;
  isActive: boolean;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

function rowToLink(row: Record<string, unknown>): LinkTile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    url: row.url as string,
    imageUrl: (row.image_url as string) ?? null,
    tileSize: row.tile_size as TileSize,
    position: row.position as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listLinks(userId: string): Promise<LinkTile[]> {
  const db: DB = getSupabase();
  const { data } = await db
    .from("links")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  const links = (data ?? []).map(rowToLink);

  const linkIds = links.map((l: LinkTile) => l.id);
  if (linkIds.length === 0) return links;

  const { data: clickCounts } = await db.rpc("link_click_counts", { p_link_ids: linkIds });
  const clicksByLink = new Map<string, number>();
  for (const row of (clickCounts ?? []) as Array<{ link_id: string; count: number }>) {
    clicksByLink.set(row.link_id, Number(row.count));
  }

  return links.map((l: LinkTile) => ({ ...l, clicks: clicksByLink.get(l.id) ?? 0 }));
}

export async function createLink(
  userId: string,
  data: { title: string; url: string; imageUrl?: string | null; tileSize?: TileSize }
): Promise<LinkTile> {
  const db: DB = getSupabase();
  const { data: existing } = await db
    .from("links")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = existing ? (existing.position as number) + 1 : 0;

  const { data: row } = await db
    .from("links")
    .insert({
      user_id: userId,
      title: data.title,
      url: data.url,
      image_url: data.imageUrl ?? null,
      tile_size: data.tileSize ?? "1x1",
      position,
    })
    .select()
    .single();

  return rowToLink(row);
}

export async function updateLink(
  id: string,
  userId: string,
  data: { title?: string; url?: string; imageUrl?: string | null; tileSize?: TileSize; isActive?: boolean }
): Promise<LinkTile> {
  const db: DB = getSupabase();
  const { data: row } = await db
    .from("links")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
      ...(data.tileSize !== undefined && { tile_size: data.tileSize }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  return rowToLink(row);
}

export async function deleteLink(id: string, userId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("links").delete().eq("id", id).eq("user_id", userId);
}

export async function reorderLinks(userId: string, order: string[]): Promise<void> {
  const db: DB = getSupabase();
  await Promise.all(
    order.map((id, position) =>
      db.from("links").update({ position }).eq("id", id).eq("user_id", userId)
    )
  );
}

export async function getPublicLinks(
  username: string
): Promise<{ profile: Profile; links: LinkTile[] } | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;
  if (profile.accountStatus !== "active") return null;

  const db: DB = getSupabase();
  const { data } = await db
    .from("links")
    .select("*")
    .eq("user_id", profile.userId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  return { profile, links: (data ?? []).map(rowToLink) };
}

export async function getLinkUrl(linkId: string): Promise<string | null> {
  const db: DB = getSupabase();
  const { data } = await db.from("links").select("url").eq("id", linkId).maybeSingle();
  return (data?.url as string) ?? null;
}

export async function recordLinkClick(linkId: string): Promise<void> {
  const db: DB = getSupabase();
  await db.from("link_clicks").insert({ link_id: linkId });
}
