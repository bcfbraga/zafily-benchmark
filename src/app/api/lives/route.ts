import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listLives, createLive, getAccountStatus } from "@/lib/lives-store";

const FREE_TIER_MAX_LIVES = 2;

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lives = await listLives(userId);
  return NextResponse.json(lives);
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
  const accountStatus = await getAccountStatus(userId);
  if (accountStatus !== "active") {
    const existing = await listLives(userId);
    if (existing.length >= FREE_TIER_MAX_LIVES) {
      return NextResponse.json({
        error: `No plano gratuito você pode criar até ${FREE_TIER_MAX_LIVES} vitrines. Ative sua conta para criar mais.`,
        code: "activation_required",
      }, { status: 403 });
    }
  }
  const live = await createLive(userId, {
    title: body.title.trim(),
    liveDate: body.liveDate ?? undefined,
    liveTime: body.liveTime ?? undefined,
    imageUrl: body.imageUrl ?? undefined,
    store: body.store ?? undefined,
    sectionId: body.sectionId ?? undefined,
    discount: body.discount !== undefined && body.discount !== null ? Number(body.discount) : undefined,
    showPrices: body.showPrices ?? undefined,
  });
  return NextResponse.json(live, { status: 201 });
}
