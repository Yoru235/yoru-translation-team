import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewChapter } from "@/lib/discord";

export async function GET(request: Request) {
    try {
        const now = new Date();

        // 1. Tìm các chapter đã đến giờ đăng nhưng chưa gửi thông báo Discord
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
            // 2. Gửi thông báo Discord
            try {
                const firstImage = chapter.images[0]?.imageUrl || chapter.manga.coverUrl;
                await notifyNewChapter(
                    { id: chapter.manga.id, title: chapter.manga.title, type: chapter.manga.type, coverUrl: chapter.manga.coverUrl },
                    { id: chapter.id, chapter: chapter.chapter, volume: chapter.volume, title: chapter.title || undefined, isH: chapter.isH, isEnd: chapter.isEnd, imageUrl: firstImage }
                );
            } catch (err) {
                console.error("Lỗi gửi Discord cho chapter hẹn giờ:", err);
            }

            // 3. Đánh dấu đã gửi
            await prisma.chapter.update({
                where: { id: chapter.id },
                data: { discordNotified: true },
            });
        }

        return NextResponse.json({ success: true, processed: pendingChapters.length });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi quét chapter hẹn giờ" }, { status: 500 });
    }
}
