import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { updateLink, deleteLink } from "@/lib/links-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const link = await updateLink(id, userId, {
    title: body.title !== undefined ? body.title.trim() : undefined,
    url: body.url !== undefined ? body.url.trim() : undefined,
    imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
    tileSize: body.tileSize !== undefined ? body.tileSize : undefined,
    isActive: body.isActive !== undefined ? body.isActive : undefined,
  });
  return NextResponse.json(link);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteLink(id, userId);
  return NextResponse.json({ ok: true });
}
