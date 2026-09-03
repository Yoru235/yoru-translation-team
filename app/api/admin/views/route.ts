import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const [totalViews, mangaViews] = await Promise.all([
      prisma.$queryRaw<
        { count: bigint }[]
      >`
        SELECT COUNT(*)::bigint AS count
        FROM "MangaView"
        WHERE "viewedAt" >= ${startOfMonth}
          AND "viewedAt" < ${startOfNextMonth}
      `,

      prisma.$queryRaw<
        {
          mangaId: string;
          title: string;
          views: bigint;
        }[]
      >`
        SELECT
          m.id AS "mangaId",
          m.title,
          COUNT(v.id)::bigint AS views
        FROM "Manga" m
        LEFT JOIN "MangaView" v
          ON v."mangaId" = m.id
          AND v."viewedAt" >= ${startOfMonth}
          AND v."viewedAt" < ${startOfNextMonth}
        GROUP BY m.id, m.title
        ORDER BY views DESC
      `,
    ]);

    return NextResponse.json({
      success: true,
      month: startOfMonth.toISOString(),

      totalViews: Number(totalViews[0]?.count ?? 0),

      mangaViews: mangaViews.map((item) => ({
        mangaId: item.mangaId,
        title: item.title,
        views: Number(item.views),
      })),
    });
  } catch (error) {
    console.error("GET ADMIN VIEWS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải thống kê lượt xem.",
      },
      { status: 500 }
    );
  }
}