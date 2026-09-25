// Cria (ou atualiza a senha de) um usuário no Supabase Auth, já com e-mail confirmado.
// Uso: npm run create-user -- <email> <senha>
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Uso: node --env-file=.env.local scripts/create-user.mjs <email> <senha>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ex.: em .env.local).");
  process.exit(1);
}

const auth = createClient(url, secret).auth.admin;

const { data, error } = await auth.createUser({ email, password, email_confirm: true });
if (!error) {
  console.log(`Usuário criado: ${email} (id ${data.user.id})`);
  process.exit(0);
}

// Já existe: só redefine a senha e confirma o e-mail
const { data: list, error: listError } = await auth.listUsers({ perPage: 1000 });
if (listError) throw listError;
const existing = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
if (!existing) throw error;

const { error: updateError } = await auth.updateUserById(existing.id, { password, email_confirm: true });
if (updateError) throw updateError;
console.log(`Usuário já existia; senha atualizada: ${email} (id ${existing.id})`);
