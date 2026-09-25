import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "./auth";
import { createClient } from "./supabase-server";

export function isAdminEmail(email: string | null | undefined): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

/** Returns the admin's userId on success, or a NextResponse to return immediately if not authorized. */
export async function requireAdmin(req: NextRequest): Promise<{ userId: string; email: string } | NextResponse> {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId, email: user!.email! };
}
