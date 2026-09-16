import { prisma } from "@/lib/prisma";
import HomePageClient from "./components/HomePageClient";

// Cache SSR trang chủ 60 giây ở Cloudflare Edge CDN
export const revalidate = 60;

export default async function Home() {
  let initialMangaList: any[] = [];
  let initialTranslationGroups: any[] = [];

  try {
    const [mangas, groups] = await Promise.all([
      prisma.manga.findMany({
        take: 100,
        orderBy: [
          { views: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          originalTitle: true,
          description: true,
          translationGroup: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          type: true,
          status: true,
          ageRestricted: true,
          coverUrl: true,
          creditUrl: true,
          genres: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.translationGroup.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { mangas: true },
          },
        },
      }),
    ]);

    initialMangaList = mangas.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    initialTranslationGroups = groups;
  } catch (error) {
    console.error("Lỗi SSR nạp dữ liệu trang chủ:", error);
  }

  return (
    <HomePageClient
      initialMangaList={initialMangaList}
      initialTranslationGroups={initialTranslationGroups}
    />
  );
}
