import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { createUnlockToken } from "@/lib/auth/unlock-token";
import { env } from "cloudflare:workers";
import { recordMangaView } from "@/lib/views";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const chapterId =
      searchParams.get("chapterId") || searchParams.get("id");

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu chapterId.",
        },
        { status: 400 }
      );
    }

    // 1. Lấy thông tin user đăng nhập
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn cần đăng nhập để đọc truyện.",
        },
        { status: 401 }
      );
    }

    // 2. Lấy thông tin chapter hiện tại
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
            creditUrl: true,
            isLocked: true,
            passwordHash: true,
            passwordHint: true,
          },
        },
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

    // 3. Lấy danh sách chapter của truyện (dành cho điều hướng Prev/Next)
    const chaptersPromise = prisma.chapter.findMany({
      where: {
        mangaId: chapter.mangaId,
      },
      orderBy: {
        chapter: "asc",
      },
      select: {
        id: true,
        chapter: true,
        volume: true,
        isH: true,
        isEnd: true,
      },
    });

    // 4. Kiểm tra cookie khóa truyện / chapter
    const cookieStore = await cookies();

    const mangaUnlocked =
      !!chapter.manga.passwordHash &&
      cookieStore.get(`manga-unlocked-${chapter.manga.id}`)?.value ===
      createUnlockToken(chapter.manga.passwordHash);

    const chapterUnlocked =
      !!chapter.passwordHash &&
      cookieStore.get(`chapter-unlocked-${chapter.id}`)?.value ===
      createUnlockToken(chapter.passwordHash);

    // 5. Đọc nội dung Novel từ R2 nếu có
    let chapterContent = chapter.content;

    if (chapter.chapterType === "Novel" && chapter.content) {
      try {
        const objectKey = chapter.content.replace(/^\/uploads\//, "");
        const novelObject = env.UPLOADS
          ? await env.UPLOADS.get(objectKey)
          : null;

        if (novelObject) {
          chapterContent = await novelObject.text();
        }
      } catch (error) {
        console.error("LOAD NOVEL FROM R2 ERROR:", error);
      }
    }

    const chapters = await chaptersPromise;

    // 6. Ghi lịch sử và lượt xem đồng thời qua Promise.all
    if (!chapter.isLocked || chapterUnlocked) {
      await Promise.all([
        prisma.readingHistory
          .upsert({
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
          })
          .catch((err) => console.error("HISTORY LOG ERROR:", err)),

        recordMangaView(chapter.mangaId).catch((err) =>
          console.error("VIEW LOG ERROR:", err)
        ),

        prisma.manga
          .update({
            where: {
              id: chapter.mangaId,
            },
            data: {
              views: {
                increment: 1,
              },
            },
          })
          .catch((err) => console.error("MANGA VIEW INCREMENT ERROR:", err)),
      ]).catch((err) => console.error("BACKGROUND TASKS ERROR:", err));
    }

    const protectedChapter = {
      ...chapter,
      content: chapterContent,
      isLocked: chapter.isLocked && !chapterUnlocked,
      manga: {
        ...chapter.manga,
        isLocked: chapter.manga.isLocked && !mangaUnlocked,
      },
    };

    const cacheHeader = protectedChapter.isLocked
      ? "private, no-cache, no-store, must-revalidate"
      : "public, max-age=60, s-maxage=600, stale-while-revalidate=3600";

    return NextResponse.json(
      {
        success: true,
        user,
        chapter: protectedChapter,
        chapters,
      },
      {
        headers: {
          "Cache-Control": cacheHeader,
        },
      }
    );
  } catch (error) {
    console.error("GET READER CHAPTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải chapter.",
      },
      { status: 500 }
    );
  }
}
