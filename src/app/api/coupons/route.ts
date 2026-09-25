import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listCoupons, createCoupon } from "@/lib/coupons-store";

export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await listCoupons(userId));
}

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const storeName = String(body.storeName ?? "").trim();
  const discountLabel = String(body.discountLabel ?? "").trim();
  const url = String(body.url ?? "").trim();

  if (!storeName) return NextResponse.json({ error: "Informe a loja" }, { status: 400 });
  if (!discountLabel) return NextResponse.json({ error: "Informe o desconto" }, { status: 400 });

  // A URL é a única ação que sempre existe no cupom — se ela não abrir, o
  // cartão não serve para nada, então é validada antes de gravar.
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
  } catch {
    return NextResponse.json({ error: "Informe um link válido da loja" }, { status: 400 });
  }

  const coupon = await createCoupon(userId, {
    storeName,
    category: String(body.category ?? "").trim() || null,
    discountLabel,
    code: String(body.code ?? "").trim() || null,
    url,
  });
  return NextResponse.json(coupon);
}
