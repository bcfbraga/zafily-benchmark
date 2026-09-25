import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getOrCreateProfile,
  listSections,
  listLives,
  AccessNotApprovedError,
} from "@/lib/lives-store";

/**
 * Tudo que o dashboard precisa numa requisição só.
 *
 * As telas buscavam /api/profile, /api/vitrine-sections e /api/lives em
 * paralelo. Como cada rota valida o token por conta própria e a função roda
 * longe do banco, eram três travessias de auth por navegação, além das idas de
 * cada consulta. Aqui o token é validado uma vez e as três leituras saem em
 * paralelo — de ~9 travessias para 2.
 *
 * As rotas individuais continuam existindo: outras telas ainda as usam.
 */
export async function GET(req: NextRequest) {
  let user: { id: string; email: string };
  try { user = await getAuthUser(req); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile, sections, lives] = await Promise.all([
      getOrCreateProfile(user.id, user.email),
      listSections(user.id),
      listLives(user.id),
    ]);

    return NextResponse.json({
      profile: { ...profile, isAdmin: isAdminEmail(user.email) },
      sections,
      lives,
    });
  } catch (err) {
    if (err instanceof AccessNotApprovedError) {
      return NextResponse.json({ error: "ACCESS_NOT_APPROVED" }, { status: 403 });
    }
    throw err;
  }
}
