import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAccessRequests } from "@/lib/access-requests-store";
import { listManagedUsers } from "@/lib/admin-users-store";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const [requests, users] = await Promise.all([listAccessRequests(), listManagedUsers()]);
  const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u]));

  const enriched = requests.map(r => {
    const account = userByEmail.get(r.email.toLowerCase());
    return { ...r, accountUserId: account?.id ?? null, plan: account?.plan ?? null };
  });

  return NextResponse.json(enriched);
}
