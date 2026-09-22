import { notFound } from "next/navigation";
import { rawQuery } from "@/lib/db";
import MangaListPageClient from "@/app/components/MangaListPageClient";

export const revalidate = 60;

type PageProps = {
  params: Promise<{
    type: string;
  }>;
};

const VALID_TYPES = ["manga", "manhwa", "manhua", "novel", "all"];

export default async function TypeListPage({ params }: PageProps) {
  const { type } = await params;
  const normalizedType = (type || "").toLowerCase();

  if (!VALID_TYPES.includes(normalizedType)) {
    notFound();
  }

  let initialMangas: any[] = [];

  try {
    const rawMangas = await rawQuery<{
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
    `);

    initialMangas = (rawMangas || []).map((m) => {
      const effectiveUpdatedAt = m.updatedAt
        ? new Date(m.updatedAt).toISOString()
        : new Date().toISOString();

      return {
        id: m.id,
        title: m.title,
        coverUrl: m.coverUrl || null,
        type: m.type || "Manga",
        status: m.status || "ongoing",
        views: Number(m.views) || 0,
        createdAt: effectiveUpdatedAt,
        updatedAt: effectiveUpdatedAt,
      };
    });
  } catch (error) {
    console.error("Lỗi SSR nạp danh sách truyện theo type:", error);
  }

  return (
    <MangaListPageClient
      initialMangas={initialMangas}
      defaultType={normalizedType}
    />
  );
}
