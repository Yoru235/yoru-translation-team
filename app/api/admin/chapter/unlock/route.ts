import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { chapterId, password } = body;

    if (!chapterId || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu chapterId hoặc mật khẩu.",
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

    if (!chapter.isLocked) {
      return NextResponse.json({
        success: true,
        message: "Chapter không bị khóa.",
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

    const isCorrect = await bcrypt.compare(
      password,
      chapter.passwordHash
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
    const cookieStore = await cookies();

cookieStore.set(
  `chapter-unlocked-${chapter.id}`,
  "true",
  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  }
);

    return NextResponse.json({
      success: true,
      message: "Mở khóa thành công.",
    });
  } catch (error) {
    console.error(
      "CHAPTER UNLOCK ERROR:",
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