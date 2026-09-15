import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  /*
  // Cấu hình cũ cho phép Googlebot, Coccocbot quét (tạm comment lại):
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
  */

  // Tạm thời chặn TẤT CẢ các bot:
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}