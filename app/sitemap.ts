import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getMangaUrl } from "@/lib/manga-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.URL_WEBSITE || "https://yorutranslation.com";

  let mangaRoutes: MetadataRoute.Sitemap = [];

  try {
    const mangas = await prisma.manga.findMany({
      select: {
        id: true,
        type: true,
        updatedAt: true,
      },
    });

    mangaRoutes = mangas.map((manga: any) => {
      return {
        url: `${baseUrl}${getMangaUrl(manga)}`,
        lastModified: manga.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error("Lỗi sinh sitemap:", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/manga`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [...staticRoutes, ...mangaRoutes];
}
