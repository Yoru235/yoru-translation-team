import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.URL_WEBSITE;

  // Các đường dẫn DÙNG CHUNG cần chặn
  const disallowRules = [
    "/chapter/",   // Chặn đọc chap (Tầng 2)
    "/login",
    "/register",
    "/admin/",     // Chặn admin cá nhân
    "/api/",
  ];

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",               // Cho phép quét toàn bộ (tự động nhận /manga, /manhua, /manhwa...)
        disallow: disallowRules,  // Chỉ loại trừ các đường dẫn bị khóa
      },
      {
        userAgent: "Coccocbot",
        allow: "/",
        disallow: disallowRules,
      },
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}