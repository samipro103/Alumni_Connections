import React from "react";
import type {
  Metadata,
  Viewport,
} from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import GlobalPullToRefresh from "@/components/layout/GlobalPullToRefresh";
import PWAProBootstrap from "@/components/pwa/PWAProBootstrap";
import { AlumniUXProvider } from "@/components/ui/AlumniUXProvider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/components/ui/alumni-ux.css";

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
    "Tu comunidad para compartir, descubrir y mantenerte cerca de tu red.",
  manifest:
    "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/alumni-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/alumni-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/alumni-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Alumni.",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0d12",
};

const themeScript = `
(function () {
  try {
    var allowed = ["dark","light","pride"];
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
          <AlumniUXProvider>
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
          </AlumniUXProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/* ALUMNI_2_0_PWA_STABILITY:ROOT_LAYOUT */
/* ALUMNI_1_0_13_DISABLE_LEGACY_MFA_ROUTE_GUARD */

/* ALUMNI_2_6_0_GLOBAL_UX:ROOT_LAYOUT */
