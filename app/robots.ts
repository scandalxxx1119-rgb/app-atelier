import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/apps/", "/users/", "/ranking", "/board", "/resources"],
        disallow: ["/admin/", "/profile/", "/submit/", "/api/", "/gacha/"],
      },
      {
        userAgent: "Mediapartners-Google",
        allow: "/",
      },
    ],
    sitemap: "https://appatelier.dev/sitemap.xml",
  };
}
