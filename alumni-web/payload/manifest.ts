import type {
  MetadataRoute,
} from "next";

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
    background_color:
      "#090b10",
    theme_color:
      "#090b10",
    orientation:
      "portrait",
    lang: "es",
    icons: [
      {
        src:
          "/icons/alumni-192.png",
        sizes:
          "192x192",
        type:
          "image/png",
        purpose:
          "any",
      },
      {
        src:
          "/icons/alumni-512.png",
        sizes:
          "512x512",
        type:
          "image/png",
        purpose:
          "any",
      },
      {
        src:
          "/icons/alumni-512-maskable.png",
        sizes:
          "512x512",
        type:
          "image/png",
        purpose:
          "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Inicio",
        short_name:
          "Inicio",
        description:
          "Abrir el feed de Alumni.",
        url: "/feed",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes:
              "192x192",
            type:
              "image/png",
          },
        ],
      },
      {
        name: "Explorar",
        short_name:
          "Explorar",
        description:
          "Descubrir personas en Alumni.",
        url: "/explore",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes:
              "192x192",
            type:
              "image/png",
          },
        ],
      },
      {
        name: "Mensajes",
        short_name:
          "Mensajes",
        description:
          "Abrir conversaciones.",
        url: "/messages",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes:
              "192x192",
            type:
              "image/png",
          },
        ],
      },
      {
        name:
          "Notificaciones",
        short_name:
          "Actividad",
        description:
          "Ver actividad reciente.",
        url:
          "/notifications",
        icons: [
          {
            src:
              "/icons/alumni-192.png",
            sizes:
              "192x192",
            type:
              "image/png",
          },
        ],
      },
    ],
  };
}
