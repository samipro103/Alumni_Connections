import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/messages/",
        ],
      },
    ],
    sitemap: "https://alumnisv.com/sitemap.xml",
    host: "https://alumnisv.com",
  };
}

/* ALUMNI_3_6_1_PUBLIC_LANDING_ADSENSE_READINESS */
