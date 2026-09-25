"use client";

import { Suspense, useEffect, useState } from "react";
import { ZafilyLogo } from "@/components/zafily/Logo";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { CheckCircle2, Loader2, AlertCircle, MailQuestion } from "lucide-react";

const perks = [
  "Monte sua vitrine e visualize gratuitamente",
  "Personalize cores, tipografia e estilo visual",
  "Organize produtos, links e recomendações",
  "Publique com ativação personalizada",
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="zf-brand min-h-screen bg-[var(--cr-background)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="flex justify-center mb-10">
          <Link href="/"><ZafilyLogo size={32} /></Link>
        </div>
        {children}
      </div>
    </div>
  );
}

function InviteRequired() {
  return (
    <Shell>
      <div className="bg-white border border-black/[0.08] rounded-[20px] p-8 shadow-[0_24px_80px_rgba(23,23,60,0.10)] text-center">
        <MailQuestion className="w-10 h-10 text-[var(--cr-brand-500)] mx-auto mb-4" />
        <h1 className="font-heading font-bold text-[22px] text-[var(--cr-text-primary)] mb-2">Este cadastro é por convite</h1>
        <p className="text-sm text-[var(--cr-text-tertiary)] mb-7 leading-relaxed">
          A Zafily libera o acesso individualmente. Solicite acesso pela página inicial — avaliamos seu momento e
          te enviamos um link de cadastro.
        </p>
        <Link
          href="/#acesso"
          className="inline-flex h-11 px-6 items-center justify-center bg-[var(--cr-brand-500)] hover:bg-[#7C75FF] text-white font-semibold rounded-[12px] transition-colors text-sm"
        >
          Solicitar acesso
        </Link>
      </div>
      <p className="text-center text-sm text-[var(--cr-text-tertiary)] mt-6">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </Shell>
  );
}

function Loading() {
  return (
    <Shell>
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 text-[var(--cr-brand-500)] animate-spin" />
      </div>
    </Shell>
  );
}

function SignupForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Este email já está cadastrado. Tente fazer login."
        : "Não foi possível criar a conta. Tente novamente.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }


  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-[var(--cr-success)] mx-auto mb-4" />
          <h1 className="font-heading font-bold text-2xl text-[var(--cr-text-primary)] mb-2">Confirme seu email</h1>
          <p className="text-sm text-[var(--cr-text-secondary)] mb-6">
            Enviamos um link de confirmação para <span className="text-[var(--cr-text-primary)] font-medium">{email}</span>.
            Clique no link para ativar sua conta.
          </p>
          <Link href="/login" className="text-sm text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] transition-colors">
            Voltar para o login
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white border border-black/[0.08] rounded-[20px] p-8 shadow-[0_24px_80px_rgba(23,23,60,0.10)]">
        <h1 className="font-heading font-bold text-[24px] text-[var(--cr-text-primary)] mb-1">Criar sua conta</h1>
        <p className="text-sm text-[var(--cr-text-tertiary)] mb-6">Seu acesso foi aprovado. Falta só definir uma senha.</p>

        <div className="space-y-2 mb-7">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--cr-success)] shrink-0" />
              <span className="text-xs text-[var(--cr-text-secondary)]">{p}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full h-12 bg-[var(--cr-background)] border border-black/[0.10] text-[var(--cr-text-tertiary)] rounded-[12px] px-4 text-sm cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cr-text-secondary)]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              disabled={loading}
              className="w-full h-12 bg-[var(--cr-background)] border border-black/[0.10] text-[var(--cr-text-primary)] placeholder:text-[var(--cr-text-tertiary)] rounded-[12px] px-4 text-sm focus:outline-none focus:border-[var(--cr-brand-500)] focus:shadow-[0_0_0_4px_rgba(247, 89, 173,0.18)] transition-all disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-[rgba(225,29,72,0.06)] border border-[rgba(225,29,72,0.20)] rounded-[12px] p-3.5">
              <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
              <p className="text-sm text-[#E11D48]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 bg-[var(--cr-brand-500)] hover:bg-[#7C75FF] disabled:opacity-50 text-white font-semibold rounded-[12px] transition-colors mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--cr-text-tertiary)] mt-5">
          Ao criar conta, você concorda com nossos{" "}
          <a href="#" className="text-[var(--cr-brand-500)] hover:underline">Termos</a> e{" "}
          <a href="#" className="text-[var(--cr-brand-500)] hover:underline">Política de Privacidade</a>.
        </p>
      </div>

      <p className="text-center text-sm text-[var(--cr-text-tertiary)] mt-6">
        Já tem conta?{" "}
        <Link href="/login" className="text-[var(--cr-brand-500)] hover:text-[var(--cr-brand-700)] font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </Shell>
  );
}

function SignupGate() {
  const searchParams = useSearchParams();
  const token = searchParams.get("invite");
  const [invite, setInvite] = useState<{ email: string } | "invalid" | "loading">("loading");

  useEffect(() => {
    const request = token
      ? fetch(`/api/access-requests/validate?token=${encodeURIComponent(token)}`).then(r => r.ok ? r.json() : { ok: false })
      : Promise.resolve({ ok: false });
    request.then(data => setInvite(data.ok ? { email: data.email } : "invalid"));
  }, [token]);

  if (invite === "loading") return <Loading />;
  if (invite === "invalid") return <InviteRequired />;
  return <SignupForm email={invite.email} />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupGate />
    </Suspense>
  );
}
