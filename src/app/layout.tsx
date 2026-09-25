import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/zafily/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zafily.com.br"),
  title: "Zafily — All your affiliate tools in one place",
  description: "Connect links, products, and platforms to organize, track, and grow your affiliate business.",
  appleWebApp: {
    capable: true,
    title: "Zafily",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#E5308F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
