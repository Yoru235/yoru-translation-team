import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { createUnlockToken } from "@/lib/auth/unlock-token";

export async function POST(request: Request) {
  try {
    // ==========================================
    // KIỂM TRA ĐĂNG NHẬP
    // ==========================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn cần đăng nhập để mở khóa.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // ĐỌC DỮ LIỆU
    // ==========================================

    const body = await request.json();

    const {
      mangaId,
      chapterId,
      password,
    } = body;

    // ==========================================
    // KIỂM TRA DỮ LIỆU
    // ==========================================

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mật khẩu.",
        },
        { status: 400 }
      );
    }

    // Không cho gửi cả 2 loại cùng lúc
    if (mangaId && chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Không xác định được loại khóa.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // KHÓA CẤP TRUYỆN
    // ==========================================

    if (mangaId) {
      const manga =
        await prisma.manga.findUnique({
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

      // Truyện không bị khóa
      if (!manga.isLocked) {
        return NextResponse.json({
          success: true,
          message: "Truyện không bị khóa.",
        });
      }

      // Chưa có mật khẩu
      if (!manga.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Truyện chưa được thiết lập mật khẩu.",
          },
          { status: 400 }
        );
      }

      // Kiểm tra mật khẩu
      const isCorrect =
        await bcrypt.compare(
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

      // ========================================
      // LƯU COOKIE MỞ KHÓA TRUYỆN
      // ========================================

      const cookieStore = await cookies();

      cookieStore.set(
        `manga-unlocked-${manga.id}`,
        createUnlockToken(manga.passwordHash),
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );

      return NextResponse.json({
        success: true,
        message:
          "Mở khóa truyện thành công.",
      });
    }

    // ==========================================
    // KHÓA RIÊNG CHAPTER
    // ==========================================

    if (chapterId) {
      const chapter =
        await prisma.chapter.findUnique({
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

      // Chapter không bị khóa
      if (!chapter.isLocked) {
        return NextResponse.json({
          success: true,
          message:
            "Chapter không bị khóa.",
        });
      }

      // Chưa có mật khẩu
      if (!chapter.passwordHash) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Chapter chưa được thiết lập mật khẩu.",
          },
          { status: 400 }
        );
      }

      // Kiểm tra mật khẩu
      const isCorrect =
        await bcrypt.compare(
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

      // ========================================
      // LƯU COOKIE MỞ KHÓA CHAPTER
      // ========================================

      const cookieStore = await cookies();

      cookieStore.set(
        `chapter-unlocked-${chapter.id}`,
        createUnlockToken(chapter.passwordHash),
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );

      return NextResponse.json({
        success: true,
        message:
          "Mở khóa chapter thành công.",
      });
    }

    // ==========================================
    // KHÔNG CÓ MANGA ID / CHAPTER ID
    // ==========================================

    return NextResponse.json(
      {
        success: false,
        error:
          "Thiếu mangaId hoặc chapterId.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "CHAPTER UNLOCK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Không thể kiểm tra mật khẩu.",
      },
      { status: 500 }
    );
  }
}