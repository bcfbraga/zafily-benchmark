"use client";

import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";

interface Props {
  title: string;
  username: string;
  slug: string;
}

export function ShareButtons({ title, username, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/${username}/${slug}`
    : `https://zafily.com.br/${username}/${slug}`;

  const text = `Vitrine "${title}" — produtos escolhidos pra você 🛍️`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 h-11 px-6 bg-[#25D366] hover:bg-[#1fbd59] text-white font-semibold text-sm rounded-full transition-colors"
      >
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 h-11 px-6 font-semibold text-sm rounded-full transition-colors"
        style={{ border: "1px solid var(--cr-border-strong)", color: "var(--cr-text-primary)", background: "var(--cr-surface)" }}
      >
        {copied ? <><Check className="w-4 h-4" style={{ color: "var(--cr-success)" }} /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar link</>}
      </button>
    </div>
  );
}
