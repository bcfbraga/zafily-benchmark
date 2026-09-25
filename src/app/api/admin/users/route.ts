import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listManagedUsers, createManagedUser } from "@/lib/admin-users-store";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const users = await listManagedUsers();
  return NextResponse.json(users);
}

/**
 * Cria uma conta direto pelo admin. Devolve a senha gerada uma única vez — ela
 * não fica armazenada em lugar nenhum, então o admin precisa repassá-la agora.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  try {
    const created = await createManagedUser(email, name);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar usuário";
    // O caso mais comum é e-mail já cadastrado; a mensagem do Supabase é clara
    const jaExiste = /already|exists|registered/i.test(msg);
    return NextResponse.json(
      { error: jaExiste ? "Já existe uma conta com este e-mail" : msg },
      { status: jaExiste ? 409 : 500 }
    );
  }
}
