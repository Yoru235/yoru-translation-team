import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mangas = await prisma.manga.findMany({
      orderBy: [
        {
          views: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        originalTitle: true,
        description: true,
        translationGroup: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
        type: true,
        status: true,
        ageRestricted: true,
        coverUrl: true,
        creditUrl: true,
        genres: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      mangas,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách manga:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy danh sách truyện",
      },
      {
        status: 500,
      }
    );
  }
}