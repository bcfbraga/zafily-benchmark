import { NextRequest, NextResponse } from "next/server";
import { getLinkUrl, recordLinkClick } from "@/lib/links-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = await getLinkUrl(id);

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await recordLinkClick(id);
  return NextResponse.redirect(url, { status: 302 });
}
