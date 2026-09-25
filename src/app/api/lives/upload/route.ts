import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { prepareImage } from "@/lib/image-upload";

const BUCKET = "live-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = await getUserId(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 });

  const { buffer, contentType, ext } = await prepareImage(Buffer.from(await file.arrayBuffer()), file.type);
  const path = `${userId}/${Date.now()}.${ext}`;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    // O padrão do Storage é `no-cache`, o que faz o navegador rebaixar a imagem
    // a cada visita. O nome do arquivo tem timestamp, então cachear 1 ano é seguro.
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
