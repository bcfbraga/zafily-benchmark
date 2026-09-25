import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { setUserBanned } from "@/lib/admin-users-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (id === admin.userId) {
    return NextResponse.json({ error: "Você não pode banir a própria conta" }, { status: 400 });
  }

  await setUserBanned(id, true);
  return NextResponse.json({ ok: true });
}
