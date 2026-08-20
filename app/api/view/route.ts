import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mangaId = body?.mangaId;

    if (!mangaId || typeof mangaId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId.",
        },
        { status: 400 }
      );
    }

    const manga = await prisma.manga.findUnique({
      where: {
        id: mangaId,
      },
      select: {
        id: true,
      },
    });

    if (!manga) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy truyện.",
        },
        { status: 404 }
      );
    }

    await prisma.mangaView.create({
      data: {
        mangaId: manga.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CREATE MANGA VIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể ghi lượt xem.",
      },
      { status: 500 }
    );
  }
}