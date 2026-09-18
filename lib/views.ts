import { prisma } from "@/lib/prisma";

export async function recordMangaView(mangaId: string) {
  if (!mangaId) return null;

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return prisma.mangaDailyView.upsert({
    where: {
      mangaId_date: {
        mangaId: mangaId,
        date: today,
      },
    },
    create: {
      mangaId: mangaId,
      date: today,
      views: 1,
    },
    update: {
      views: {
        increment: 1,
      },
    },
  });
}
