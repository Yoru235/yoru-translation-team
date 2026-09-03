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

    const bookmarks = await prisma.bookmark.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      bookmarks,
    });
  } catch (error) {
    console.error("GET BOOKMARKS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách bookmark.",
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
    const mangaId = String(body.mangaId || "").trim();

    if (!mangaId) {
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

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_mangaId: {
          userId: user.id,
          mangaId,
        },
      },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });

      return NextResponse.json({
        success: true,
        bookmarked: false,
        message: "Đã bỏ bookmark.",
      });
    }

    await prisma.bookmark.create({
      data: {
        userId: user.id,
        mangaId,
      },
    });

    return NextResponse.json({
      success: true,
      bookmarked: true,
      message: "Đã thêm vào bookmark.",
    });
  } catch (error) {
    console.error("POST BOOKMARK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật bookmark.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const mangaId = String(body.mangaId || "").trim();

    if (!mangaId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId.",
        },
        { status: 400 }
      );
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: user.id,
        mangaId,
      },
    });

    return NextResponse.json({
      success: true,
      bookmarked: false,
      message: "Đã bỏ bookmark.",
    });
  } catch (error) {
    console.error("DELETE BOOKMARK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa bookmark.",
      },
      { status: 500 }
    );
  }
}