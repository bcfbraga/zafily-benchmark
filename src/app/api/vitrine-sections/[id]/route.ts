import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { renameSection, deleteSection } from "@/lib/lives-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }
  const section = await renameSection(id, userId, body.name.trim());
  return NextResponse.json(section);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteSection(id, userId);
  return NextResponse.json({ ok: true });
}
