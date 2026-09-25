import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getLive } from "@/lib/lives-store";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const live = await getLive(id, userId);
  if (!live) return NextResponse.json({ error: "Live não encontrada" }, { status: 404 });

  const { order } = await req.json() as { order: string[] };
  if (!Array.isArray(order)) return NextResponse.json({ error: "order inválido" }, { status: 400 });

  const supabase = await createClient();
  await Promise.all(
    order.map((productId, position) =>
      (supabase as any).from("live_products").update({ position }).eq("id", productId).eq("live_id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
