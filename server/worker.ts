import handler from "vinext/server/fetch-handler";
import { createPrismaClient, prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";

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
          const db = env?.yoru_database
            ? createPrismaClient(env.yoru_database)
            : prisma;
          const now = new Date();

          // Tìm các chapter đã đến giờ hẹn nhưng chưa bắn Discord
          const pendingChapters = await db.chapter.findMany({
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

              await sendDiscordNotification(
                { DISCORD_WEBHOOK_URL: env?.DISCORD_WEBHOOK_URL },
                {
                  type: chapter.isEnd ? "MANGA_END" : "NEW_CHAPTER",
                  manga: {
                    id: chapter.manga.id,
                    title: chapter.manga.title,
                    type: chapter.manga.type,
                    coverUrl: chapter.manga.coverUrl,
                  },
                  chapter: {
                    id: chapter.id,
                    chapter: chapter.chapter,
                    volume: chapter.volume,
                    title: chapter.title || undefined,
                    isH: chapter.isH,
                    isEnd: chapter.isEnd,
                    imageUrl: firstImage,
                  },
                }
              );
            } catch (discordErr) {
              console.error("[Cron Discord Webhook Error]:", discordErr);
            }

            // Đánh dấu đã thông báo
            await db.chapter.update({
              where: { id: chapter.id },
              data: { discordNotified: true },
            });
          }
        } catch (error: any) {
          console.error("[Cron Scheduled Error]:", error?.message || error, {
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
          });
        }
      })()
    );
  },
};
