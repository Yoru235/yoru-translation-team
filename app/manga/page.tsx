import { prisma } from "@/lib/prisma";
import MangaListPageClient from "@/app/components/MangaListPageClient";

export default async function MangaListPage() {
  let initialMangas: any[] = [];

  try {
    const mangas = await prisma.manga.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        type: true,
        status: true,
      },
    });

    initialMangas = mangas;
  } catch (error) {
    console.error("Lỗi SSR nạp danh sách truyện:", error);
  }

  return <MangaListPageClient initialMangas={initialMangas} />;
}