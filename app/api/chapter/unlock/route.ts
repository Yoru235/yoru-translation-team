import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { mangaId, chapterId, password } = body;

    if (
      (!mangaId && !chapterId) ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId/chapterId hoặc mật khẩu.",
        },
        { status: 400 }
      );
    }

    // Nếu gửi mangaId thì kiểm tra mật khẩu của cả truyện
    if (mangaId) {
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

      if (!manga.isLocked) {
        return NextResponse.json({
          success: true,
          message: "Truyện không bị khóa.",
          unlockType: "manga",
        });
      }

      if (!manga.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            error: "Truyện chưa được thiết lập mật khẩu.",
          },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(
        password,
        manga.passwordHash
      );

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Mật khẩu không đúng.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Mở khóa truyện thành công.",
        unlockType: "manga",
        mangaId: manga.id,
      });
    }

    // Nếu không có mangaId thì xử lý khóa riêng chapter
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
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

    if (!chapter.isLocked) {
      return NextResponse.json({
        success: true,
        message: "Chapter không bị khóa.",
        unlockType: "chapter",
      });
    }

    if (!chapter.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Chapter chưa được thiết lập mật khẩu.",
        },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(
      password,
      chapter.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mở khóa chapter thành công.",
      unlockType: "chapter",
      chapterId: chapter.id,
    });
  } catch (error) {
    console.error(
      "CHAPTER/MANGA UNLOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể mở khóa.",
      },
      { status: 500 }
    );
  }
}