import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ==========================================
// KHÓA / MỞ KHÓA TRUYỆN
// ==========================================

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      mangaId,
      isLocked,
      password,
      passwordHint,
    } = body;

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

    // ==========================================
    // MỞ KHÓA
    // ==========================================

    if (!isLocked) {
      const updatedManga = await prisma.manga.update({
        where: {
          id: mangaId,
        },
        data: {
          isLocked: false,
          passwordHash: null,
          passwordHint: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã mở khóa truyện.",
        manga: updatedManga,
      });
    }

    // ==========================================
    // KHÓA → PHẢI CÓ PASSWORD
    // ==========================================

    if (
      typeof password !== "string" ||
      password.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập mật khẩu.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const updatedManga = await prisma.manga.update({
      where: {
        id: mangaId,
      },
      data: {
        isLocked: true,
        passwordHash,
        passwordHint:
          typeof passwordHint === "string" &&
          passwordHint.trim() !== ""
            ? passwordHint.trim()
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã khóa truyện thành công.",
      manga: updatedManga,
    });
  } catch (error) {
    console.error(
      "ADMIN MANGA LOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật trạng thái khóa truyện.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// KHÓA / MỞ KHÓA CHAPTER
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      chapterId,
      isLocked,
      password,
      passwordHint,
    } = body;

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

    // ==========================================
    // MỞ KHÓA CHAPTER
    // ==========================================

    if (!isLocked) {
      const updatedChapter =
        await prisma.chapter.update({
          where: {
            id: chapterId,
          },
          data: {
            isLocked: false,
            passwordHash: null,
            passwordHint: null,
          },
        });

      return NextResponse.json({
        success: true,
        message: "Đã mở khóa chapter.",
        chapter: updatedChapter,
      });
    }

    // ==========================================
    // KHÓA CHAPTER → PHẢI CÓ PASSWORD
    // ==========================================

    if (
      typeof password !== "string" ||
      password.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập mật khẩu.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const updatedChapter =
      await prisma.chapter.update({
        where: {
          id: chapterId,
        },
        data: {
          isLocked: true,
          passwordHash,
          passwordHint:
            typeof passwordHint === "string" &&
            passwordHint.trim() !== ""
              ? passwordHint.trim()
              : null,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Đã khóa chapter thành công.",
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error(
      "ADMIN CHAPTER LOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật trạng thái khóa chapter.",
      },
      { status: 500 }
    );
  }
}