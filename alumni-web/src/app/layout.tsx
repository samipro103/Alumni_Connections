import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import GlobalPullToRefresh from "@/components/layout/GlobalPullToRefresh";
import PWAProBootstrap from "@/components/pwa/PWAProBootstrap";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Alumni.",
    template: "%s · Alumni.",
  },
  applicationName: "Alumni.",
  description:
    "La red para compartir logros, conectar talento y descubrir oportunidades.",
  appleWebApp: {
    capable: true,
    title: "Alumni.",
    statusBarStyle: "black-translucent",
  },
};

const themeScript = `
(function () {
  try {
    var allowed = ["dark","light","chill","pride","midnight","emerald","executive"];
    var saved = localStorage.getItem("alumni-theme") || "dark";
    var theme = allowed.indexOf(saved) >= 0 ? saved : "dark";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" || theme === "chill" ? "light" : "dark";
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <Script
          id="alumni-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />

        <ThemeProvider>
          <AuthProvider>
            <GlobalPullToRefresh />
            <PWAProBootstrap />

            <div
              id="alumni-root-content"
              className="min-h-[100dvh]"
            >
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
