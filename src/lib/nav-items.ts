import { ShoppingBag, Receipt, BarChart2, Link2, Ticket, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Minha Vitrine", href: "/app/vitrine", icon: ShoppingBag },
  { label: "Links", href: "/app/links", icon: Link2 },
  { label: "Cupons", href: "/app/cupons", icon: Ticket },
  { label: "Propostas", href: "/app/orcamentos", icon: Receipt },
  { label: "Performance", href: "/app/performance", icon: BarChart2 },
];
