import { AtSign, Users, MapPin, Eye, PlayCircle, TrendingUp, MessageCircle, Mail, Link as LinkIcon, Sparkles } from "lucide-react";
import styles from "./proposal.module.css";

export const HOURS_ITEM = "Cobertura de Eventos";

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number | null;
  notes: string | null;
  position: number;
}

export interface ProposalValuePoint {
  title: string;
  body: string;
}

export interface ProposalBudget {
  clientName: string | null;
  clientLogoUrl: string | null;
  finalValue: number | null;
  expiresAt: string | null;
  valueIntro: string | null;
  valuePoints: ProposalValuePoint[] | null;
  valueHidden: boolean;
  conditions: string | null;
  conditionsHidden: boolean;
  items: ProposalItem[];
}

export interface ProposalProfile {
  username: string;
  displayName: string | null;
  instagramHandle: string | null;
  location: string | null;
  followersLabel: string | null;
  reachLabel: string | null;
  viewsLabel: string | null;
  engagementLabel: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  linkUrl: string | null;
  photoUrl: string | null;
  roleTitle: string | null;
}

export function formatDateBR(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function itemLabel(item: { description: string; quantity: number | null }): string {
  if (item.description === HOURS_ITEM) return `${HOURS_ITEM} (Até ${item.quantity ?? 0} horas)`;
  return item.quantity && item.quantity > 1 ? `${item.quantity}x ${item.description}` : item.description;
}

export function activeScopeItems<T extends { quantity: number | null; position: number }>(items: T[]): T[] {
  return [...items].filter(i => (i.quantity ?? 0) > 0).sort((a, b) => a.position - b.position);
}

export function whatsappLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const number = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${number}`;
}

export function normalizeUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function ProposalView({ budget, profile, photoSrc }: { budget: ProposalBudget; profile: ProposalProfile; photoSrc?: string | null }) {
  const creatorName = profile.displayName || profile.username;

  const metaParts: string[] = [];
  if (profile.instagramHandle) metaParts.push(`@${profile.instagramHandle.replace(/^@/, "")}`);
  if (profile.followersLabel) metaParts.push(`${profile.followersLabel} seguidores`);
  if (profile.location) metaParts.push(profile.location);

  const stats = [
    { icon: Users, value: profile.followersLabel, label: "Seguidores" },
    { icon: Eye, value: profile.reachLabel, label: "Alcance mensal" },
    { icon: PlayCircle, value: profile.viewsLabel, label: "Visualizações" },
    { icon: TrendingUp, value: profile.engagementLabel, label: "Engajamento" },
  ].filter(s => s.value);

  const scopeItems = activeScopeItems(budget.items);

  const valuePoints = (budget.valuePoints ?? []).filter(p => p.title.trim() || p.body.trim());
  const showValueSection = !budget.valueHidden && (Boolean(budget.valueIntro?.trim()) || valuePoints.length > 0);

  const conditions = budget.conditionsHidden ? [] : (budget.conditions ?? "").split("\n").map(c => c.trim()).filter(Boolean);

  const whatsapp = profile.whatsapp ? whatsappLink(profile.whatsapp) : null;
  const contacts = [
    whatsapp && { icon: MessageCircle, label: profile.whatsapp as string, href: whatsapp },
    profile.contactEmail && { icon: Mail, label: profile.contactEmail, href: `mailto:${profile.contactEmail}` },
    profile.instagramHandle && { icon: AtSign, label: profile.instagramHandle.replace(/^@/, ""), href: `https://instagram.com/${profile.instagramHandle.replace(/^@/, "")}` },
    profile.linkUrl && { icon: LinkIcon, label: profile.linkUrl, href: normalizeUrl(profile.linkUrl) },
  ].filter(Boolean) as { icon: typeof MessageCircle; label: string; href: string }[];

  const ctaHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent("Olá, gostaria de falar sobre a proposta comercial.")}`
    : null;

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={`${styles.section} ${styles.hero}`}>
        {photoSrc && (
          <div className={styles.heroPhotoBg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrc} alt={creatorName} />
          </div>
        )}
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Proposta Comercial</p>
          <h1 className={styles.h1}>{creatorName}</h1>
          {metaParts.length > 0 && (
            <div className={styles.metaRow} style={{ marginTop: 22 }}>
              {profile.instagramHandle && (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={styles.iconBadge}>
                    {photoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "999px" }} />
                    ) : (
                      <AtSign className="w-4 h-4" />
                    )}
                  </span>
                  {profile.instagramHandle.replace(/^@/, "")}
                </span>
              )}
              {profile.instagramHandle && (profile.followersLabel || profile.location) && <span className={styles.dot} />}
              {profile.followersLabel && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users className="w-3.5 h-3.5" />{profile.followersLabel} seguidores</span>
              )}
              {profile.followersLabel && profile.location && <span className={styles.dot} />}
              {profile.location && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
            </div>
          )}
          {budget.clientLogoUrl && (
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", marginTop: 22, background: "rgba(255,255,255,.95)", border: "1px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={budget.clientLogoUrl} alt={budget.clientName ?? ""} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}
        </div>
      </section>

      {/* Metrics */}
      {stats.length > 0 && (
        <section className={`${styles.section} ${styles.metrics}`}>
          <div className={styles.metricsGrid}>
            {stats.map(({ icon: Icon, value, label }) => (
              <article key={label} className={styles.metric}>
                <div className={styles.metricIcon}><Icon className="w-5 h-5" /></div>
                <span className={styles.metricValue}>{value}</span>
                <span className={styles.metricLabel}>{label}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className={styles.divider} />

      {/* Deliverables */}
      <section className={`${styles.section} ${styles.deliverablesSection}`}>
        <div className={styles.deliverablesWrap}>
          <p className={styles.kicker}>O Que Será Entregue</p>
          {scopeItems.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>O escopo será adicionado em breve.</p>
          ) : (
            <ul className={styles.deliverables}>
              {scopeItems.map(item => (
                <li key={item.id} className={styles.deliverableItem}>
                  <span className={styles.miniIcon}><Sparkles className="w-5 h-5" /></span>
                  <span>
                    {itemLabel(item)}
                    {item.notes && <span className={styles.deliverableNotes}>{item.notes}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Value proposition */}
      {showValueSection && (
        <section className={`${styles.section} ${styles.valueSection}`}>
          <div className={styles.sectionTitle}>
            <h2>Valor Gerado</h2>
            {budget.valueIntro?.trim() && <p>{budget.valueIntro}</p>}
          </div>
          {valuePoints.length > 0 && (
            <div className={styles.valueGrid}>
              {valuePoints.map((point, i) => (
                <article key={i} className={styles.valueCard}>
                  <div className={styles.valueIcon}><Sparkles className="w-4 h-4" /></div>
                  {point.title && <h3>{point.title}</h3>}
                  {point.body && <p>{point.body}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Investment */}
      {budget.finalValue != null && (
        <section className={`${styles.section} ${styles.investment}`}>
          <p className={styles.eyebrow}>Investimento</p>
          <div className={styles.investmentPrice}>{formatBRL(budget.finalValue)}</div>
          <p>O valor contempla o escopo descrito nesta proposta.</p>
          <p className={styles.investmentNote}>
            {budget.expiresAt ? `Proposta válida até ${formatDateBR(budget.expiresAt)}.` : "Valor personalizado conforme escopo."}
          </p>
        </section>
      )}

      {/* Conditions */}
      {conditions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <h2>Condições</h2>
          </div>
          <ul className={styles.conditionsGrid}>
            {conditions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}

      {/* Contact */}
      <section className={`${styles.section} ${styles.contactSection}`}>
        {contacts.length > 0 && (
          <div className={styles.contactGrid}>
            {contacts.map(({ icon: Icon, label, href }, i) => (
              <a key={i} className={styles.contactItem} href={href} target="_blank" rel="noopener noreferrer">
                <span className={styles.contactIcon}><Icon className="w-4 h-4" /></span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        )}
        <footer className={styles.footerRow}>
          <div>
            <span className={styles.signature}>{creatorName}</span>
            {profile.roleTitle && <span className={styles.role}>{profile.roleTitle}</span>}
          </div>
          {ctaHref && (
            <a className={styles.cta} href={ctaHref} target="_blank" rel="noopener noreferrer">
              Falar sobre a proposta
            </a>
          )}
        </footer>
      </section>

      <p className={styles.footerMark}>Criado com Zafily</p>
    </main>
  );
}
