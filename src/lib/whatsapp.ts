export const ACTIVATION_WHATSAPP_NUMBER = "5513974228358";

export function buildActivationWhatsappLink(profile?: { displayName?: string | null; username?: string | null; instagramHandle?: string | null } | null): string {
  let text = "Olá! Criei minha conta na Zafily e quero ativar minha vitrine personalizada.";
  if (profile?.displayName || profile?.username) {
    const name = profile.displayName || profile.username;
    const handle = profile.instagramHandle ? `, meu perfil é @${profile.instagramHandle}` : "";
    text = `Olá! Sou ${name}${handle} e criei minha conta na Zafily. Quero ativar minha vitrine personalizada.`;
  }
  return `https://wa.me/${ACTIVATION_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
