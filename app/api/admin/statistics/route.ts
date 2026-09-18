import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const nowVN = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    const d7 = new Date(nowVN);
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toLocaleDateString("en-CA");

    const d30 = new Date(nowVN);
    d30.setDate(d30.getDate() - 30);
    const d30Str = d30.toLocaleDateString("en-CA");

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
        COALESCE(SUM("views"), 0) as totalViews,
        COALESCE(SUM(CASE WHEN "date" >= ${todayStr} THEN "views" ELSE 0 END), 0) as todayViews,
        COALESCE(SUM(CASE WHEN "date" >= ${d7Str} THEN "views" ELSE 0 END), 0) as views7Days,
        COALESCE(SUM(CASE WHEN "date" >= ${d30Str} THEN "views" ELSE 0 END), 0) as views30Days
      FROM "MangaDailyView"
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
        views: true,
      },
      orderBy: {
        views: "desc",
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
        views: manga.views,
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