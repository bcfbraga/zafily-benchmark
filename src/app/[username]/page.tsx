import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { themeCssVars } from "@/lib/design-presets";
import { getPublicLinks } from "@/lib/links-store";
import { listActiveCoupons } from "@/lib/coupons-store";
import { resolveCurrentUsername } from "@/lib/lives-store";
import { PublicFooter } from "@/components/zafily/PublicFooter";
import { PublicProfileHeader } from "@/components/zafily/PublicProfileHeader";
import { PublicProfileTabs } from "@/components/zafily/PublicProfileTabs";
import { PublicSocialRow } from "@/components/zafily/PublicSocialRow";
import { PublicCoupons } from "@/components/zafily/PublicCoupons";
import { BentoLinksGrid } from "@/components/zafily/BentoLinksGrid";
import { titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${titleCase(username)} - Feito por Zafily` };
}

/**
 * O link da bio: perfil → redes → cupons → links → rodapé.
 *
 * A estrutura é fixa e o conteúdo vem todo do banco, por afiliada. Cada seção
 * some sozinha quando não tem conteúdo, então uma afiliada sem cupons não vê
 * um título órfão no meio da página.
 */
export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params;

  const result = await getPublicLinks(username);

  if (!result) {
    const currentUsername = await resolveCurrentUsername(username);
    if (currentUsername) redirect(`/${currentUsername}`);
    notFound();
  }

  const { profile, links } = result;
  // Depois do perfil, não em paralelo com ele: assim um username inexistente
  // ou uma conta suspensa não chegam a consultar cupom nenhum.
  const coupons = await listActiveCoupons(profile.userId);

  return (
    <div
      className="min-h-screen"
      style={{
        // O tema do perfil sobrescreve os tokens --cr-*; sem tema, cai no padrão
        ...themeCssVars(profile.designSettings, profile.photoUrl),
        background: "var(--cr-background)",
        color: "var(--cr-text-primary)",
        fontFamily: "var(--cr-font)",
      }}
    >
      <PublicProfileHeader profile={profile} showNiche />

      <div className="max-w-2xl mx-auto px-5">
        <PublicSocialRow links={profile.socialLinks} />
        <PublicProfileTabs username={profile.username} />
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-20">
        <PublicCoupons coupons={coupons} />
        <BentoLinksGrid links={links} />
      </div>
      <PublicFooter />
    </div>
  );
}
