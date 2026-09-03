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

    const [
      totalViews,
      todayViews,
      views7Days,
      views30Days,
      totalMangas,
      totalChapters,
    ] = await Promise.all([
      prisma.mangaView.count(),

      prisma.mangaView.count({
        where: {
          viewedAt: {
            gte: startOfToday,
          },
        },
      }),

      prisma.mangaView.count({
        where: {
          viewedAt: {
            gte: startOf7Days,
          },
        },
      }),

      prisma.mangaView.count({
        where: {
          viewedAt: {
            gte: startOf30Days,
          },
        },
      }),

      prisma.manga.count(),

      prisma.chapter.count(),
    ]);

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