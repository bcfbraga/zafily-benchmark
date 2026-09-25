import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Valida o token e devolve id e e-mail numa chamada só.
 *
 * `auth.getUser()` é uma ida à rede até o Supabase, e a função roda longe do
 * banco — cada chamada custa centenas de ms. Rotas que precisavam do e-mail
 * chamavam getUserId() e logo depois getUser() de novo, pagando a travessia
 * duas vezes pelo mesmo dado.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  return { id: user.id, email: user.email ?? `${user.id}@unknown` };
}

export async function getUserId(req: NextRequest): Promise<string> {
  const { id } = await getAuthUser(req);
  return id;
}
