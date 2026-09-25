import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { updateCoupon, deleteCoupon } from "@/lib/coupons-store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.url !== undefined) {
    try {
      const u = new URL(String(body.url).trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return NextResponse.json({ error: "Informe um link válido da loja" }, { status: 400 });
    }
  }

  const coupon = await updateCoupon(id, userId, {
    ...(body.storeName !== undefined && { storeName: String(body.storeName).trim() }),
    ...(body.category !== undefined && { category: String(body.category ?? "").trim() || null }),
    ...(body.discountLabel !== undefined && { discountLabel: String(body.discountLabel).trim() }),
    ...(body.code !== undefined && { code: String(body.code ?? "").trim() || null }),
    ...(body.url !== undefined && { url: String(body.url).trim() }),
    ...(body.isActive !== undefined && { isActive: !!body.isActive }),
  });

  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
  return NextResponse.json(coupon);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteCoupon(id, userId);
  return NextResponse.json({ ok: true });
}
