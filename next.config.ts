import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // O Storage do Supabase responde com `cache-control: no-cache`, então sem
    // isto o otimizador rebuscaria o original a cada pedido e o ganho seria
    // nulo. Os nomes de arquivo carregam timestamp (imagem trocada = URL nova),
    // então guardar por 30 dias é seguro.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Imagens hospedadas no Supabase passam pelo otimizador da Vercel, que as
    // busca uma vez e serve do CDN — sem isso cada pageview baixava o PNG
    // original (1-2 MB) direto do Storage e estourava a cota de egress.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
