import { Sidebar } from "@/components/zafily/Sidebar";
import { MobileBottomNav } from "@/components/zafily/MobileBottomNav";
import { AccountGate } from "@/components/zafily/AccountGate";

/**
 * Mesma lógica da landing: o canvas é o fundo contínuo e a navegação e o
 * conteúdo são superfícies arredondadas flutuando sobre ele. O respiro entre
 * elas — onde o canvas aparece — é o que liga o dashboard ao resto do site.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="zf-brand h-dvh overflow-hidden flex flex-col lg:flex-row"
      style={{ background: "var(--page-background)", gap: "var(--canvas-gap)", padding: "var(--canvas-gap)" }}
    >
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:rounded-[var(--radius-xl)]"
        style={{ background: "var(--surface-panel)" }}
      >
        {children}
      </main>
      <MobileBottomNav />
      <AccountGate />
    </div>
  );
}
