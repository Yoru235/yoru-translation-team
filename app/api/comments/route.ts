import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mangaId = searchParams.get("mangaId");
    const chapterId = searchParams.get("chapterId");

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId hoặc chapterId.",
        },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        ...(mangaId ? { mangaId } : {}),
        ...(chapterId ? { chapterId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("GET COMMENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải bình luận.",
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
          error: "Bạn cần đăng nhập để bình luận.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    const mangaId =
      typeof body.mangaId === "string"
        ? body.mangaId
        : null;

    const chapterId =
      typeof body.chapterId === "string"
        ? body.chapterId
        : null;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Nội dung bình luận không được để trống.",
        },
        { status: 400 }
      );
    }

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId hoặc chapterId.",
        },
        { status: 400 }
      );
    }

    if (mangaId) {
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
    }

    if (chapterId) {
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

      if (mangaId && chapter.mangaId !== mangaId) {
        return NextResponse.json(
          {
            success: false,
            error: "Chapter không thuộc truyện này.",
          },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        mangaId,
        chapterId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE COMMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo bình luận.",
      },
      { status: 500 }
    );
  }
}