import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Alumni.",
    short_name: "Alumni.",
    description:
      "Comparte logros, conecta talento y descubre oportunidades.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#090b10",
    theme_color: "#090b10",
    orientation: "portrait",
    icons: [
      { src: "/icons/alumni-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/alumni-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/alumni-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
