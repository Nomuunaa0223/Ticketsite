import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AiAgentDemoBanner } from "@/components/layout/ai-agent-demo-banner";
import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Tixora",
  description: "Fair tickets with visible pricing, verified ownership, and calmer event operations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ScrollAwareHeader>
          <SiteHeader />
        </ScrollAwareHeader>
        <AiAgentDemoBanner />
        <main className="relative z-10 min-h-[calc(100vh-12rem)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
