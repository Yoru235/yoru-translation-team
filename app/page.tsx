import { prisma } from "@/lib/prisma";
import HomePageClient from "./components/HomePageClient";

export default async function Home() {
  let initialMangaList: any[] = [];
  let initialTranslationGroups: any[] = [];

  try {
    const mangas = await prisma.manga.findMany({
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
    });

    initialMangaList = mangas.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    const groups = await prisma.translationGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { mangas: true },
        },
      },
    });

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
