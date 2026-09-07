import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createUnlockToken } from "@/lib/auth/unlock-token";
import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mangaId = searchParams.get("mangaId");
    const chapterId = searchParams.get("chapterId");

    // ==========================================
    // KIỂM TRA THAM SỐ
    // ==========================================

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        {
          error: "Thiếu mangaId hoặc chapterId.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // LẤY CHAPTER THEO CHAPTER ID
    // ==========================================

    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: {
          id: chapterId,
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          manga: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              type: true,
              isLocked: true,
              passwordHash: true,
            },
          },
        },
      });

      if (!chapter) {
        return NextResponse.json(
          {
            error: "Không tìm thấy chapter.",
          },
          { status: 404 }
        );
      }
const cookieStore = await cookies();

const mangaUnlocked =
  chapter.manga.isLocked &&
  !!chapter.manga.passwordHash &&
  cookieStore.get(
    `manga-unlocked-${chapter.manga.id}`
  )?.value ===
    createUnlockToken(chapter.manga.passwordHash);

const chapterUnlocked =
  chapter.isLocked &&
  !!chapter.passwordHash &&
  cookieStore.get(
    `chapter-unlocked-${chapter.id}`
  )?.value ===
    createUnlockToken(chapter.passwordHash);
      let chapterContent = chapter.content;

if (
  chapter.chapterType === "Novel" &&
  chapter.content
) {
  try {
    const objectKey = chapter.content.replace(
      /^\/uploads\//,
      ""
    );

    const novelObject =
      await env.UPLOADS.get(objectKey);

    if (novelObject) {
      chapterContent =
        await novelObject.text();
    }
  } catch (error) {
    console.error(
      "LOAD NOVEL FROM R2 ERROR:",
      error
    );
  }
}

const protectedChapter = {
  ...chapter,
  content: chapterContent,
};

return NextResponse.json({
  success: true,
  chapter: protectedChapter,
});
    }

    // ==========================================
    // LẤY DANH SÁCH CHAPTER CỦA TRUYỆN
    // ==========================================

    const chapters = await prisma.chapter.findMany({
      where: {
        mangaId: mangaId!,
      },
      orderBy: [
        {
          chapter: "asc",
        },
      ],
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      chapters,
    });
  } catch (error) {
    console.error(
      "GET CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể tải chapter.",
      },
      { status: 500 }
    );
  }
}