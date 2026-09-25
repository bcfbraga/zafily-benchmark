import Image from "next/image";
import { Link2 } from "lucide-react";
import type { LinkTile, TileSize } from "@/lib/links-store";

const SPAN: Record<TileSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Um tile ocupa metade da largura no mobile e no máximo ~200px no desktop,
// então nunca vale a pena baixar o original.
const TILE_SIZES = "(max-width: 640px) 50vw, 200px";

function TileIcon({ link, className }: { link: LinkTile; className: string }) {
  return link.imageUrl ? (
    <Image src={link.imageUrl} alt="" fill sizes={TILE_SIZES} className="object-cover" />
  ) : (
    <div className={`${className} flex items-center justify-center`} style={{ background: "var(--cr-brand-100)" }}>
      <Link2 className="w-1/3 h-1/3" style={{ color: "var(--cr-brand-600)" }} />
    </div>
  );
}

function Tile({ link }: { link: LinkTile }) {
  const href = `/api/click/link/${link.id}`;

  if (link.tileSize === "1x1") {
    return (
      <a href={href} className={`${SPAN["1x1"]} relative rounded-2xl overflow-hidden transition-transform hover:scale-[1.03]`}>
        <TileIcon link={link} className="w-full h-full" />
      </a>
    );
  }

  if (link.tileSize === "2x1") {
    return (
      <a
        href={href}
        className={`${SPAN["2x1"]} rounded-2xl px-4 flex flex-col justify-center gap-0.5 transition-colors hover:opacity-90`}
        style={{ background: "var(--cr-surface)", border: "1px solid var(--cr-border)" }}
      >
        <span className="text-sm font-semibold truncate" style={{ color: "var(--cr-text-primary)" }}>{link.title}</span>
        <span className="text-xs truncate" style={{ color: "var(--cr-text-tertiary)" }}>{hostname(link.url)}</span>
      </a>
    );
  }

  // 1x2 / 2x2 — image + title (2x2 also gets the subtitle)
  return (
    <a
      href={href}
      className={`${SPAN[link.tileSize]} rounded-2xl overflow-hidden relative flex flex-col justify-end transition-transform hover:scale-[1.02]`}
    >
      <TileIcon link={link} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 p-3 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
        <p className="text-sm font-semibold text-white truncate">{link.title}</p>
        {link.tileSize === "2x2" && (
          <p className="text-xs text-white/80 truncate">{hostname(link.url)}</p>
        )}
      </div>
    </a>
  );
}

export function BentoLinksGrid({ links }: { links: LinkTile[] }) {
  if (links.length === 0) return null;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[110px] sm:auto-rows-[140px]"
    >
      {links.map(link => <Tile key={link.id} link={link} />)}
    </div>
  );
}
