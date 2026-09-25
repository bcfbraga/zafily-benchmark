import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Profile } from "@/lib/lives-store";

/**
 * `showNiche` existe para que a página de vitrines continue byte a byte como
 * está no ar. O cabeçalho é compartilhado, e sem esta trava o dia em que
 * alguém preenchesse "Cargo / título" nas configurações veria a página de
 * vitrines mudar sozinha — que é justamente o que não pode acontecer.
 */
export function PublicProfileHeader({ profile, showNiche = false }: { profile: Profile; showNiche?: boolean }) {
  const displayName = profile.displayName || profile.username;
  return (
    <div className="max-w-2xl mx-auto px-5 pt-16 pb-10 text-center">
      {/* Nicho acima do avatar: é o enquadramento ("Afiliada · Moda & Beleza")
          que diz de cara do que a página trata, antes de quem a assina. */}
      {showNiche && profile.roleTitle && (
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--cr-text-tertiary)" }}
        >
          {profile.roleTitle}
        </p>
      )}
      <div className="cr-avatar-wrapper mb-4">
        <div className="cr-avatar overflow-hidden flex items-center justify-center" style={{ background: "var(--cr-brand-50)" }}>
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={displayName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold" style={{ color: "var(--cr-brand-400)" }}>{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
      </div>
      <h1 className="cr-page-title" style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>{displayName}</h1>
      {profile.bio && (
        <p className="cr-body-text mt-2 max-w-md mx-auto">{profile.bio}</p>
      )}
      <div className="flex items-center justify-center gap-3 flex-wrap mt-2 text-sm" style={{ color: "var(--cr-text-tertiary)" }}>
        <span>@{profile.username}</span>
        {profile.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {profile.location}
          </span>
        )}
      </div>
    </div>
  );
}
