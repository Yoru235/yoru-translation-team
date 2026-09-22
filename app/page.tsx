import { rawQuery } from "@/lib/db";
import HomePageClient from "./components/HomePageClient";

// Cache SSR trang chủ 60 giây ở Cloudflare Edge CDN
export const revalidate = 60;

export default async function Home() {
  let initialMangaList: any[] = [];
  let initialTranslationGroups: any[] = [];

  try {
    // Chỉ truy vấn đúng các trường cần thiết phục vụ hiển thị trang chủ qua SQL thô trên D1
    const [rawMangas, rawGroups] = await Promise.all([
      rawQuery<{
        id: string;
        title: string;
        coverUrl: string | null;
        type: string;
        status: string;
        views: number;
        updatedAt: string | number | Date;
      }>(`
        SELECT 
          m.id, 
          m.title, 
          m.coverUrl, 
          m.type, 
          m.status, 
          m.views, 
          COALESCE(
            (SELECT MAX(c.createdAt) FROM Chapter c WHERE c.mangaId = m.id),
            m.updatedAt,
            m.createdAt
          ) AS updatedAt
        FROM Manga m
        ORDER BY updatedAt DESC
        LIMIT 100
      `),
      rawQuery<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        mangaCount: number;
      }>(`
        SELECT 
          tg.id, 
          tg.name, 
          tg.slug, 
          tg.avatar, 
          (SELECT COUNT(*) FROM Manga WHERE translationGroupId = tg.id) AS mangaCount
        FROM TranslationGroup tg
        ORDER BY tg.createdAt DESC
        LIMIT 10
      `),
    ]);

    initialMangaList = (rawMangas || []).map((m) => ({
      id: m.id,
      title: m.title,
      coverUrl: m.coverUrl || null,
      type: m.type || "Manga",
      status: m.status || "ongoing",
      views: Number(m.views) || 0,
      createdAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : new Date().toISOString(),
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : new Date().toISOString(),
    }));

    initialTranslationGroups = (rawGroups || []).map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      avatar: g.avatar || null,
      description: null,
      _count: {
        mangas: Number(g.mangaCount) || 0,
      },
    }));
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
