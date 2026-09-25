import { Topbar } from "@/components/zafily/Topbar";
import { Link2 } from "lucide-react";
import Link from "next/link";

export default function ImportPage() {
  return (
    <>
      <Topbar title="Importar links" description="Importe links de afiliado para sua biblioteca" />
      <main className="flex-1 overflow-y-auto scrollbar-hidden px-8 py-7">
        <div className="max-w-[720px] mx-auto flex flex-col items-center justify-center py-32 gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(247, 89, 173,0.12)] flex items-center justify-center">
            <Link2 className="w-7 h-7 text-[var(--cr-brand-500)]" />
          </div>
          <div>
            <p className="font-heading font-semibold text-[var(--cr-text-primary)] text-lg">Em breve</p>
            <p className="text-[var(--cr-text-tertiary)] text-sm mt-1 max-w-sm">
              A importação manual de links está sendo desenvolvida. Por enquanto, sincronize os produtos diretamente pela página de Produtos.
            </p>
          </div>
          <Link
            href="/app/products"
            className="h-10 px-5 bg-[var(--cr-brand-500)] hover:bg-[var(--cr-brand-700)] text-white text-sm font-semibold rounded-[4px] transition-colors"
          >
            Ir para Produtos
          </Link>
        </div>
      </main>
    </>
  );
}
