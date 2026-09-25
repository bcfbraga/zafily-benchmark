import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listSections, createSection } from "@/lib/lives-store";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sections = await listSections(userId);
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }
  const section = await createSection(userId, body.name.trim());
  return NextResponse.json(section, { status: 201 });
}
