import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLang } from "@/lib/i18n-server";
import { AiAgentDemoBanner } from "@/components/layout/ai-agent-demo-banner";
import { HideOnAuthRoutes } from "@/components/layout/hide-on-auth-routes";
import { LangProvider } from "@/components/layout/lang-context";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PageTransition } from "@/components/layout/page-transition";
import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { SessionInactivityLogout } from "@/components/layout/session-inactivity-logout";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Tixora",
  description: "Fair tickets with visible pricing, verified ownership, and calmer event operations."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();
  const lang = await getCurrentLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Goldman:wght@700&family=Manrope:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700;800&subset=cyrillic,cyrillic-ext&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <LangProvider initialLang={lang}>
        <NavigationProgress />
        {user ? <SessionInactivityLogout role={user.role} /> : null}
        <HideOnAuthRoutes>
          <ScrollAwareHeader>
            <SiteHeader />
          </ScrollAwareHeader>
          <AiAgentDemoBanner />
        </HideOnAuthRoutes>
        <main className="relative z-10 min-h-[calc(100vh-12rem)] pb-16 lg:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <HideOnAuthRoutes>
          <SiteFooter isLoggedIn={!!user} />
        </HideOnAuthRoutes>
        </LangProvider>
      </body>
    </html>
  );
}
