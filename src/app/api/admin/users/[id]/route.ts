import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deleteUserAccount } from "@/lib/admin-users-store";
import { updateProfile } from "@/lib/lives-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = await req.json();
  const profile = await updateProfile(id, {
    plan: body.plan !== undefined ? (body.plan || null) : undefined,
    planExpiresAt: body.planExpiresAt !== undefined ? (body.planExpiresAt || null) : undefined,
  });
  return NextResponse.json(profile);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (id === admin.userId) {
    return NextResponse.json({ error: "Você não pode excluir a própria conta" }, { status: 400 });
  }

  await deleteUserAccount(id);
  return NextResponse.json({ ok: true });
}
