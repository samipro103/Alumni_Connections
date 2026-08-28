import type {
  MetadataRoute,
} from "next";

export default function manifest():
  MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Alumni.",
    short_name: "Alumni.",
    description:
      "Tu comunidad para compartir, descubrir y mantenerte cerca de tu red.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color:
      "#0b0d12",
    theme_color:
      "#0b0d12",
    lang: "es",
    categories: [
      "social",
      "education",
    ],
    icons: [
      {
        src:
          "/icons/alumni-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src:
          "/icons/alumni-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src:
          "/icons/alumni-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Inicio",
        short_name: "Inicio",
        url: "/feed",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Explorar",
        short_name: "Explorar",
        url: "/explore",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Mensajes",
        short_name: "Mensajes",
        url: "/messages",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Notificaciones",
        short_name:
          "Notificaciones",
        url: "/notifications",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}

/* ALUMNI_2_0_PWA_MANIFEST */
