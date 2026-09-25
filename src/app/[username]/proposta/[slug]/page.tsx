import { notFound, redirect } from "next/navigation";
import { getPublicBudget, getProfileByUsername, resolveCurrentUsername } from "@/lib/budgets-store";
import { Clock } from "lucide-react";
import { AutoPrint } from "./AutoPrint";
import { ProposalView } from "@/components/zafily/ProposalView";
import styles from "@/components/zafily/proposal.module.css";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ print?: string }>;
}

async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function ProposalPage({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const { print } = await searchParams;

  const [budget, profile] = await Promise.all([
    getPublicBudget(username, slug),
    getProfileByUsername(username),
  ]);

  if (!budget || !profile) {
    const currentUsername = await resolveCurrentUsername(username);
    if (currentUsername) redirect(`/${currentUsername}/proposta/${slug}`);
    notFound();
  }

  const creatorName = profile.displayName || profile.username;
  const expired = budget.expiresAt ? new Date(budget.expiresAt + "T23:59:59") < new Date() : false;

  if (expired) {
    return (
      <div className={styles.pageBg}>
        <div className={styles.page} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", gap: 12, textAlign: "center" }}>
          <Clock className="w-8 h-8" style={{ color: "var(--muted)" }} />
          <p className={styles.h1} style={{ fontSize: 26 }}>Esta proposta expirou</p>
          <p style={{ color: "var(--muted)", maxWidth: 380 }}>
            Entre em contato com {creatorName} para receber uma proposta atualizada.
          </p>
        </div>
      </div>
    );
  }

  const heroPhotoSrc = profile.photoUrl ? (await toDataUri(profile.photoUrl)) ?? profile.photoUrl : null;

  return (
    <div className={styles.pageBg}>
      <AutoPrint enabled={print === "1"} />
      <ProposalView budget={budget} profile={profile} photoSrc={heroPhotoSrc} />
    </div>
  );
}
