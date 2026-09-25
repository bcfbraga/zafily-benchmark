import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listLinks, createLink } from "@/lib/links-store";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const links = await listLinks(userId);
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }
  if (!body.url?.trim()) {
    return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
  }
  const link = await createLink(userId, {
    title: body.title.trim(),
    url: body.url.trim(),
    imageUrl: body.imageUrl ?? null,
    tileSize: body.tileSize ?? "1x1",
  });
  return NextResponse.json(link, { status: 201 });
}
