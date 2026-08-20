import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mangaId = body?.mangaId;
    const password = body?.password;

    if (
      typeof mangaId !== "string" ||
      !mangaId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mangaId.",
        },
        { status: 400 }
      );
    }

    if (
      typeof password !== "string" ||
      !password.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập mật khẩu.",
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
        isLocked: true,
        passwordHash: true,
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
        message: "Truyện đã được mở khóa.",
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

    const isCorrect = await bcrypt.compare(
      password,
      manga.passwordHash
    );

    if (!isCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // MẬT KHẨU ĐÚNG → TẠO COOKIE MỞ KHÓA
    // ==========================================

    const response = NextResponse.json({
      success: true,
      message: "Mật khẩu chính xác.",
    });

    response.cookies.set(
      `manga_unlocked_${manga.id}`,
      "true",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: `/manga/${manga.id}`,
        maxAge: 60 * 60 * 24,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "MANGA UNLOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể kiểm tra mật khẩu.",
      },
      { status: 500 }
    );
  }
}