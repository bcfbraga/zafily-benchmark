import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getLive, deleteProduct } from "@/lib/lives-store";
import { getSupabase } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, productId } = await params;
  const live = await getLive(id, userId);
  if (!live) return NextResponse.json({ error: "Live não encontrada" }, { status: 404 });

  await deleteProduct(productId, id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, productId } = await params;
  const live = await getLive(id, userId);
  if (!live) return NextResponse.json({ error: "Live não encontrada" }, { status: 404 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("name"     in body) patch.name     = body.name     ?? null;
  if ("price"    in body) patch.price    = body.price    ?? null;
  if ("category" in body) patch.category = body.category ?? null;
  if ("size"     in body) patch.size     = body.size     ?? null;
  if ("imageUrl" in body) patch.image_url = body.imageUrl ?? null;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nenhum campo" }, { status: 400 });
  const supabase = getSupabase();

  // A marca de erro da importação é sobre o estado atual do produto, não sobre
  // o que a loja devolveu naquele dia. Se a usuária preencheu o que faltava à
  // mão, o aviso tem de sumir sozinho — senão ela corrige e o alerta fica lá,
  // acusando um problema que não existe mais.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: atual } = await (supabase as any)
    .from("live_products")
    .select("name, image_url")
    .eq("id", productId)
    .eq("live_id", id)
    .single();

  if (atual) {
    const nome = ("name" in patch ? patch.name : atual.name) as string | null;
    const imagem = ("image_url" in patch ? patch.image_url : atual.image_url) as string | null;
    const temNome = !!nome?.trim();
    const temImagem = !!imagem?.trim();
    if (temNome && temImagem) {
      patch.import_status = "ok";
      patch.import_error = null;
    } else if (temNome || temImagem) {
      patch.import_status = "partial";
      patch.import_error = temNome
        ? "A imagem do produto não foi encontrada."
        : "O nome do produto não foi encontrado.";
    } else {
      patch.import_status = "failed";
      patch.import_error = "O produto está sem nome e sem imagem.";
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("live_products")
    .update(patch)
    .eq("id", productId)
    .eq("live_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
