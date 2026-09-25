import { NextRequest, NextResponse } from "next/server";
import { createAccessRequest } from "@/lib/access-requests-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });

  await createAccessRequest({
    name,
    email,
    socialHandle: body.socialHandle?.trim() || null,
    followersRange: body.followersRange || null,
    platforms: body.platforms?.trim() || null,
    currentDelivery: body.currentDelivery?.trim() || null,
    biggestDifficulty: body.biggestDifficulty?.trim() || null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
