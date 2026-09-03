import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const history = await prisma.readingHistory.findMany({
      where: {
        userId: user.id,
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            type: true,
            status: true,
          },
        },
        chapter: {
          select: {
            id: true,
            chapter: true,
            volume: true,
          },
        },
      },
      orderBy: {
        readAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("GET READING HISTORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải lịch sử đọc.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const chapterId = String(body.chapterId || "").trim();

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu chapterId.",
        },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        id: true,
        mangaId: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy chapter.",
        },
        { status: 404 }
      );
    }

    const history = await prisma.readingHistory.upsert({
      where: {
        userId_chapterId: {
          userId: user.id,
          chapterId: chapter.id,
        },
      },
      update: {
        readAt: new Date(),
        mangaId: chapter.mangaId,
      },
      create: {
        userId: user.id,
        mangaId: chapter.mangaId,
        chapterId: chapter.id,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("POST READING HISTORY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lưu lịch sử đọc.",
      },
      { status: 500 }
    );
  }
}