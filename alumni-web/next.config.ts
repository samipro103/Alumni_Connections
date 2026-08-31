import type {
  NextConfig,
} from "next";

const securityHeaders = [
  {
    key:
      "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key:
      "X-Frame-Options",
    value: "DENY",
  },
  {
    key:
      "Referrer-Policy",
    value: "no-referrer",
  },
  {
    key:
      "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key:
      "Cross-Origin-Opener-Policy",
    value:
      "same-origin-allow-popups",
  },
  {
    key:
      "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key:
      "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://open.spotify.com https://www.youtube.com https://www.youtube-nocookie.com https://*.googlesyndication.com https://*.doubleclick.net https://fundingchoicesmessages.google.com",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  turbopack: {
    root: process.cwd(),
  },

  async headers() {
    return [
      {
        source:
          "/:path*",
        headers:
          securityHeaders,
      },
    ];
  },
};

export default nextConfig;

/* ALUMNI_3_3_0A_WEB_ADS:CSP */

/* ALUMNI_3_7_0_PERFORMANCE_RELIABILITY_CORE */
