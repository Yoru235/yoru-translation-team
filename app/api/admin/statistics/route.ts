import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOf7Days = new Date(now);
    startOf7Days.setDate(startOf7Days.getDate() - 7);

    const startOf30Days = new Date(now);
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    // MyPhungg
    type ViewStatsResult = {
      totalViews: bigint | number;
      todayViews: bigint | number;
      views7Days: bigint | number;
      views30Days: bigint | number;
    };

    type ContentStatsResult = {
      totalMangas: bigint | number;
      totalChapters: bigint | number;
    };

    // 1. Gộp 4 câu count của MangaView thành 1 query duy nhất
    const [viewStats] = await prisma.$queryRaw<ViewStatsResult[]>`
      SELECT 
        COUNT(*) as totalViews,
        COUNT(CASE WHEN "viewedAt" >= ${startOfToday} THEN 1 END) as todayViews,
        COUNT(CASE WHEN "viewedAt" >= ${startOf7Days} THEN 1 END) as views7Days,
        COUNT(CASE WHEN "viewedAt" >= ${startOf30Days} THEN 1 END) as views30Days
      FROM "MangaView"
    `;

    // 2. Đếm tổng số Manga và Chapter bằng SQL thô (hoặc dùng 2 câu prisma.count tuần tự)
    const [contentStats] = await prisma.$queryRaw<ContentStatsResult[]>`
      SELECT 
        (SELECT COUNT(*) FROM "Manga") as totalMangas,
        (SELECT COUNT(*) FROM "Chapter") as totalChapters
    `;

    // 3. Ép kiểu về number (vì $queryRaw trong SQLite/D1 hoặc Postgres có thể trả về kiểu BigInt)
    const totalViews = Number(viewStats?.totalViews || 0);
    const todayViews = Number(viewStats?.todayViews || 0);
    const views7Days = Number(viewStats?.views7Days || 0);
    const views30Days = Number(viewStats?.views30Days || 0);

    const totalMangas = Number(contentStats?.totalMangas || 0);
    const totalChapters = Number(contentStats?.totalChapters || 0);
    // const [
    //   totalViews,
    //   todayViews,
    //   views7Days,
    //   views30Days,
    //   totalMangas,
    //   totalChapters,
    // ] = await Promise.all([
    //   prisma.mangaView.count(),

    //   prisma.mangaView.count({
    //     where: {
    //       viewedAt: {
    //         gte: startOfToday,
    //       },
    //     },
    //   }),

    //   prisma.mangaView.count({
    //     where: {
    //       viewedAt: {
    //         gte: startOf7Days,
    //       },
    //     },
    //   }),

    //   prisma.mangaView.count({
    //     where: {
    //       viewedAt: {
    //         gte: startOf30Days,
    //       },
    //     },
    //   }),

    //   prisma.manga.count(),

    //   prisma.chapter.count(),
    // ]);

    const topMangas = await prisma.manga.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        _count: {
          select: {
            viewRecords: true,
          },
        },
      },
      orderBy: {
        viewRecords: {
          _count: "desc",
        },
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,

      statistics: {
        totalViews,
        todayViews,
        views7Days,
        views30Days,
        totalMangas,
        totalChapters,
      },

      topMangas: topMangas.map((manga) => ({
        id: manga.id,
        title: manga.title,
        author: manga.author,
        coverUrl: manga.coverUrl,
        views: manga._count.viewRecords,
      })),
    });
  } catch (error) {
    console.error("ADMIN STATISTICS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải thống kê.",
      },
      { status: 500 }
    );
  }
}