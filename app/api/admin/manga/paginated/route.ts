import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Lấy thông số phân trang từ URL query
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Chạy tuần tự 2 query để tránh ngắt connection pool D1 / Cloudflare Worker
    const total = await prisma.manga.count();

    const mangas = await prisma.manga.findMany({
      skip,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        author: true,
        releaseDate: true,
        description: true,
        type: true,
        status: true,
        ageRestricted: true,
        coverUrl: true,
        creditUrl: true,
        translationGroupId: true,
        translationGroup: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        views: true,
        genres: true,
        isLocked: true,
        passwordHint: true,
        chapters: {
          select: {
            id: true,
            chapter: true,
            volume: true,
          },
          orderBy: {
            chapter: "desc",
          },
          take: 1,
        },
      },
    });
    // Ví dụ với Prisma / SQL query
    const totalOngoing = await prisma.manga.count({ where: { status: 'ongoing' } });
    const totalCompleted = await prisma.manga.count({ where: { status: 'completed' } });
    const totalManga = await prisma.manga.count();

    // return NextResponse.json({
    //   success: true,
    //   mangas,
    //   pagination: { totalPages, ... },
    //   stats: {
    //     total: totalManga,
    //     ongoing: totalOngoing,
    //     completed: totalCompleted,
    //   }
    // });

    return NextResponse.json({
      success: true,
      mangas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalManga,
        ongoing: totalOngoing,
        completed: totalCompleted,
      }
    });
  } catch (error) {
    console.error("GET PAGINATED MANGA ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách truyện phân trang.",
      },
      { status: 500 }
    );
  }
}