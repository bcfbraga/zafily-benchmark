import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zafily — All your affiliate tools in one place",
    short_name: "Zafily",
    description: "Connect links, products, and platforms to organize, track, and grow your affiliate business.",
    start_url: "/app/vitrine",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E5308F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
