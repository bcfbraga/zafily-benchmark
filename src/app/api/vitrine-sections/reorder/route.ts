import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { reorderSections } from "@/lib/lives-store";

export async function PATCH(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { order } = await req.json() as { order: string[] };
  if (!Array.isArray(order)) return NextResponse.json({ error: "order inválido" }, { status: 400 });

  await reorderSections(userId, order);
  return NextResponse.json({ ok: true });
}
