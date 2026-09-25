// Massa de teste para desenvolvimento local.
// Cria o login admin@gmail.com / admin123 e preenche a conta com vitrines,
// produtos, links, orçamento e pedidos de acesso. Pode rodar de novo: apaga e recria.
// Uso: npm run seed
import { createClient } from "@supabase/supabase-js";

const EMAIL = "admin@gmail.com";
const PASSWORD = "admin123";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local.");
  process.exit(1);
}

const supabase = createClient(url, secret);

function check(label, { error }) {
  if (error) {
    console.error(`Falhou em ${label}:`, error.message);
    process.exit(1);
  }
}

// 1. Usuário (cria ou redefine a senha)
async function upsertUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
  });
  if (!error) return data.user.id;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find(u => u.email?.toLowerCase() === EMAIL);
  if (!existing) throw error;
  check("atualizar senha", await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true }));
  return existing.id;
}

const userId = await upsertUser();
console.log(`✓ Login: ${EMAIL} / ${PASSWORD}`);

// 2. Limpa o que o seed criou antes (as tabelas filhas caem em cascata)
for (const table of ["lives", "vitrine_sections", "links", "budgets"]) {
  check(`limpar ${table}`, await supabase.from(table).delete().eq("user_id", userId));
}
check("limpar pedidos", await supabase.from("access_requests").delete().like("email", "%@teste.zafily.dev"));

// 3. Perfil ativo, com plano válido
const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
check("perfil", await supabase.from("profiles").upsert({
  user_id: userId,
  username: "admin",
  display_name: "Admin Teste",
  account_status: "active",
  plan: "Creator Elite",
  plan_expires_at: inOneYear,
  instagram_handle: "@admin.teste",
  location: "São Paulo, SP",
  bio: "Conta de teste do ambiente de desenvolvimento.",
  followers_label: "120 mil",
  reach_label: "450 mil",
  views_label: "1,2 mi",
  engagement_label: "4,8%",
  contact_email: EMAIL,
}, { onConflict: "user_id" }));

// 4. Seções e vitrines (lives) com produtos
const { data: sections, error: sectionsError } = await supabase.from("vitrine_sections")
  .insert([{ user_id: userId, name: "Moda", position: 0 }, { user_id: userId, name: "Casa", position: 1 }])
  .select();
check("seções", { error: sectionsError });

const img = seed => `https://picsum.photos/seed/${seed}/600/600`;
const today = new Date().toISOString().slice(0, 10);

const lives = [
  { title: "Achadinhos de Moda", slug: "achadinhos-de-moda", status: "published", store: "Shein", discount: 15, section: 0,
    products: [["Vestido midi floral", "129,90", "M"], ["Tênis casual branco", "199,90", "38"], ["Bolsa tiracolo", "89,90", null]] },
  { title: "Casa Organizada", slug: "casa-organizada", status: "published", store: "Amazon", discount: null, section: 1,
    products: [["Kit potes herméticos", "79,90", null], ["Cesto organizador", "49,90", null]] },
  { title: "Rascunho de Black Friday", slug: "rascunho-black-friday", status: "draft", store: null, discount: null, section: null,
    products: [["Fone bluetooth", "149,90", null]] },
];

for (const [i, live] of lives.entries()) {
  const { data: created, error } = await supabase.from("lives").insert({
    user_id: userId,
    title: live.title,
    slug: live.slug,
    status: live.status,
    store: live.store,
    discount: live.discount,
    live_date: today,
    image_url: img(live.slug),
    position: i,
    section_id: live.section === null ? null : sections[live.section].id,
  }).select().single();
  check(`vitrine ${live.title}`, { error });

  const { data: products, error: productsError } = await supabase.from("live_products").insert(
    live.products.map(([name, price, size], position) => ({
      live_id: created.id,
      url: `https://example.com/produto/${live.slug}-${position}`,
      name, price, size, position,
      image_url: img(`${live.slug}-${position}`),
      import_status: "ok",
    })),
  ).select();
  check(`produtos de ${live.title}`, { error: productsError });

  if (live.status === "published") {
    // Números para o dashboard: visualizações dos últimos 7 dias e cliques
    const days = [...Array(7)].map((_, d) => ({
      live_id: created.id,
      day: new Date(Date.now() - d * 86400000).toISOString().slice(0, 10),
      count: 20 + Math.floor(Math.random() * 80),
    }));
    check("impressões", await supabase.from("live_impressions").insert(days));
    const clicks = products.flatMap(p => [...Array(3 + Math.floor(Math.random() * 10))].map(() => ({ product_id: p.id })));
    check("cliques", await supabase.from("product_clicks").insert(clicks));
  }
}
console.log(`✓ ${lives.length} vitrines com produtos`);

// 5. Links da página pública
check("links", await supabase.from("links").insert([
  { user_id: userId, title: "Meu Instagram", url: "https://instagram.com", tile_size: "2x1", position: 0 },
  { user_id: userId, title: "Cupom da semana", url: "https://example.com/cupom", tile_size: "1x1", position: 1 },
  { user_id: userId, title: "Fale comigo", url: "https://wa.me/5511999999999", tile_size: "1x1", position: 2 },
]));
console.log("✓ 3 links");

// 6. Orçamento com itens
const { data: budget, error: budgetError } = await supabase.from("budgets").insert({
  user_id: userId, title: "Campanha Verão", slug: "campanha-verao",
  client_name: "Marca Exemplo", final_value: 3500, status: "published",
}).select().single();
check("orçamento", { error: budgetError });
check("itens do orçamento", await supabase.from("budget_items").insert([
  { budget_id: budget.id, description: "Reels", quantity: 2, position: 0 },
  { budget_id: budget.id, description: "Stories", quantity: 5, position: 1 },
]));
console.log("✓ 1 orçamento");

// 7. Pedidos de acesso para a tela de admin
check("pedidos de acesso", await supabase.from("access_requests").insert([
  { name: "Maria Teste", email: "maria@teste.zafily.dev", social_handle: "@maria", followers_range: "10k-50k", platforms: "Instagram" },
  { name: "João Teste", email: "joao@teste.zafily.dev", social_handle: "@joao", followers_range: "50k-100k", platforms: "TikTok" },
]));
console.log("✓ 2 pedidos de acesso pendentes");

console.log("\nPronto! Lembre de ter ADMIN_EMAILS=admin@gmail.com no .env.local e reiniciar o npm run dev.");
