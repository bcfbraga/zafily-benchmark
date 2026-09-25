"use client";

import { useState } from "react";
import { ZafilyLogo } from "@/components/zafily/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }


  return (
    <div className="zf-brand min-h-screen bg-[var(--cr-background)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-10">
          <Link href="/"><ZafilyLogo size={32} /></Link>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-[20px] p-8 shadow-[0_24px_80px_rgba(23,23,60,0.10)]">
          <h1 className="font-heading font-bold text-[24px] text-[var(--cr-text-primary)] mb-1">Bem-vinda de volta</h1>
          <p className="text-sm text-[var(--cr-text-tertiary)] mb-8">Entre na sua conta Zafily</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                disabled={loading}
                className="w-full h-12 bg-[var(--cr-background)] border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-[12px] px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:shadow-[0_0_0_4px_rgba(247, 89, 173,0.18)] transition-all disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Senha</label>
                <Link href="/forgot-password" className="text-xs text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full h-12 bg-[var(--cr-background)] border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-[12px] px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:shadow-[0_0_0_4px_rgba(247, 89, 173,0.18)] transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-[rgba(225,29,72,0.06)] border border-[rgba(225,29,72,0.20)] rounded-[12px] p-3.5">
                <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                <p className="text-sm text-[#BE123C]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-12 bg-[var(--cr-brand-500)] hover:bg-[#7C75FF] disabled:opacity-50 text-white font-semibold rounded-[12px] transition-colors mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--cr-text-tertiary)] mt-6">
          Ainda não tem acesso?{" "}
          <Link href="/#acesso" className="text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] font-medium transition-colors">
            Solicite um convite
          </Link>
        </p>
      </div>
    </div>
  );
}
