import { NextRequest, NextResponse } from "next/server";
import { validateInviteToken } from "@/lib/access-requests-store";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });

  const invite = await validateInviteToken(token);
  if (!invite) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.json({ ok: true, name: invite.name, email: invite.email });
}
