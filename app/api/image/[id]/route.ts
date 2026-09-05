import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { env } from "cloudflare:workers";

import { prisma } from "@/lib/prisma";

import { getCurrentUser } from "@/lib/auth/session";

import { createUnlockToken } from "@/lib/auth/unlock-token";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
};

function getContentType(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "application/octet-stream";
  }

  const extension = fileName
    .slice(lastDot)
    .toLowerCase();

  return (
    CONTENT_TYPES[extension] ||
    "application/octet-stream"
  );
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // ==========================================
    // KIỂM TRA ĐĂNG NHẬP
    // ==========================================

    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse(
        "Bạn cần đăng nhập.",
        { status: 401 }
      );
    }

    // ==========================================
    // LẤY ID ẢNH
    // ==========================================

    const { id } = await context.params;

    if (!id) {
      return new NextResponse(
        "Thiếu ID ảnh.",
        { status: 400 }
      );
    }

    // ==========================================
    // TÌM ẢNH TRONG DATABASE
    // ==========================================

    const image =
      await prisma.chapterImage.findUnique({
        where: {
          id,
        },
        include: {
          chapter: {
            select: {
              isLocked: true,
              passwordHash: true,
              mangaId: true,
              manga: {
                select: {
                  isLocked: true,
                  passwordHash: true,
                },
              },
            },
          },
        },
      });

    if (!image) {
      return new NextResponse(
        "Không tìm thấy ảnh.",
        { status: 404 }
      );
    }

    // ==========================================
    // KIỂM TRA KHÓA TRUYỆN
    // ==========================================

    const cookieStore = await cookies();

    if (image.chapter.manga.isLocked) {
      const mangaUnlockCookie =
        cookieStore.get(
          `manga-unlocked-${image.chapter.mangaId}`
        );

      const mangaUnlocked =
        !!image.chapter.manga.passwordHash &&
        mangaUnlockCookie?.value ===
          createUnlockToken(
            image.chapter.manga.passwordHash
          );

      if (!mangaUnlocked) {
        return new NextResponse(
          "Truyện chưa được mở khóa.",
          { status: 403 }
        );
      }
    }

    // ==========================================
    // KIỂM TRA KHÓA CHAPTER
    // ==========================================

    if (image.chapter.isLocked) {
      const chapterUnlockCookie =
        cookieStore.get(
          `chapter-unlocked-${image.chapterId}`
        );

      const chapterUnlocked =
        !!image.chapter.passwordHash &&
        chapterUnlockCookie?.value ===
          createUnlockToken(
            image.chapter.passwordHash
          );

      if (!chapterUnlocked) {
        return new NextResponse(
          "Chapter chưa được mở khóa.",
          { status: 403 }
        );
      }
    }

    // ==========================================
    // KIỂM TRA ĐƯỜNG DẪN R2
    // ==========================================

    if (
      !image.imageUrl.startsWith(
        "/uploads/"
      )
    ) {
      return new NextResponse(
        "Đường dẫn ảnh không hợp lệ.",
        { status: 400 }
      );
    }

    // ==========================================
    // LẤY OBJECT KEY TRONG R2
    //
    // Ví dụ:
    // /uploads/chapters/123-abc.webp
    //
    // => chapters/123-abc.webp
    // ==========================================

    const objectKey =
      image.imageUrl.slice(
        "/uploads/".length
      );

    if (!objectKey) {
      return new NextResponse(
        "Đường dẫn ảnh không hợp lệ.",
        { status: 400 }
      );
    }

    // ==========================================
    // CHỐNG PATH TRAVERSAL
    // ==========================================

    if (
      objectKey.includes("..") ||
      objectKey.startsWith("/") ||
      objectKey.includes("\\")
    ) {
      return new NextResponse(
        "Đường dẫn ảnh không hợp lệ.",
        { status: 400 }
      );
    }

    // ==========================================
    // LẤY ẢNH TỪ CLOUDFLARE R2
    // ==========================================

    const object =
      await env.UPLOADS.get(objectKey);

    if (!object) {
      console.error(
        "R2 IMAGE NOT FOUND:",
        objectKey
      );

      return new NextResponse(
        "Không tìm thấy ảnh trên R2.",
        { status: 404 }
      );
    }

    // ==========================================
    // CONTENT TYPE
    // ==========================================

    const contentType =
      object.httpMetadata?.contentType ||
      getContentType(objectKey);

    // ==========================================
    // TRẢ ẢNH
    // ==========================================

    return new NextResponse(
      object.body,
      {
        status: 200,

        headers: {
          "Content-Type": contentType,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",

          "Content-Length":
            String(object.size),
        },
      }
    );
  } catch (error) {
    console.error(
      "GET PROTECTED IMAGE ERROR:",
      error
    );

    return new NextResponse(
      "Không thể tải ảnh.",
      { status: 500 }
    );
  }
}