// Lista os logins cadastrados no Supabase Auth.
// Uso: npm run list-users
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");
  process.exit(1);
}

const { data, error } = await createClient(url, secret).auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;

if (data.users.length === 0) {
  console.log("Nenhum usuário cadastrado. Rode `npm run seed` para criar admin@gmail.com / admin123.");
} else {
  console.table(data.users.map(u => ({
    email: u.email,
    confirmado: u.email_confirmed_at ? "sim" : "não",
    criado_em: u.created_at?.slice(0, 10),
    ultimo_login: u.last_sign_in_at?.slice(0, 10) ?? "-",
  })));
}
