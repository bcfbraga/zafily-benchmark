import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getLive, updateLive, updateLiveSlug, deleteLive, listProducts } from "@/lib/lives-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const live = await getLive(id, userId);
  if (!live) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const products = await listProducts(id);
  return NextResponse.json({ ...live, products });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  if (body.slug !== undefined) {
    const result = await updateLiveSlug(id, userId, body.slug);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const live = await updateLive(id, userId, {
    title: body.title,
    liveDate: body.liveDate,
    liveTime: body.liveTime,
    imageUrl: body.imageUrl,
    store: body.store !== undefined ? (body.store ?? null) : undefined,
    discount: body.discount !== undefined ? (body.discount === null ? null : Number(body.discount)) : undefined,
    discountType: body.discountType !== undefined ? body.discountType : undefined,
    couponCode: body.couponCode !== undefined ? (body.couponCode || null) : undefined,
    sectionId: body.sectionId !== undefined ? (body.sectionId ?? null) : undefined,
    showPrices: body.showPrices !== undefined ? Boolean(body.showPrices) : undefined,
    showTitle: body.showTitle !== undefined ? Boolean(body.showTitle) : undefined,
  });
  return NextResponse.json(live);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteLive(id, userId);
  return NextResponse.json({ ok: true });
}
