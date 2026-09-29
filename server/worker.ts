import handler from "vinext/server/fetch-handler";
import { prisma } from "@/lib/prisma";
import { notifyNewChapter } from "@/lib/discord";

export default {
  // 1. Chuyển toàn bộ HTTP request cho Next.js / Vinext xử lý
  async fetch(request: Request, env: any, ctx: any) {
    return handler.fetch(request, env, ctx);
  },

  // 2. Cloudflare Cron Trigger tự động gọi mỗi phút
  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(
      (async () => {
        try {
          const now = new Date();

          // Tìm các chapter đã đến giờ hẹn nhưng chưa bắn Discord
          const pendingChapters = await prisma.chapter.findMany({
            where: {
              publishedAt: { lte: now },
              discordNotified: false,
            },
            include: {
              manga: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          });

          for (const chapter of pendingChapters) {
            try {
              const firstImage =
                chapter.images[0]?.imageUrl || chapter.manga.coverUrl;

              await notifyNewChapter(
                {
                  id: chapter.manga.id,
                  title: chapter.manga.title,
                  type: chapter.manga.type,
                  coverUrl: chapter.manga.coverUrl,
                },
                {
                  id: chapter.id,
                  chapter: chapter.chapter,
                  volume: chapter.volume,
                  title: chapter.title || undefined,
                  isH: chapter.isH,
                  isEnd: chapter.isEnd,
                  imageUrl: firstImage,
                }
              );
            } catch (discordErr) {
              console.error("[Cron Discord Webhook Error]:", discordErr);
            }

            // Đánh dấu đã thông báo
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { discordNotified: true },
            });
          }
        } catch (error) {
          console.error("[Cron Scheduled Error]:", error);
        }
      })()
    );
  },
};
