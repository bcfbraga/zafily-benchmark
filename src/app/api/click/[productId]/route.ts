import { NextRequest, NextResponse } from "next/server";
import { getProductUrl, recordProductClick } from "@/lib/lives-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const url = await getProductUrl(productId);

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await recordProductClick(productId);
  return NextResponse.redirect(url, { status: 302 });
}
