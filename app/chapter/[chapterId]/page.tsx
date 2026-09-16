import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createUnlockToken } from "@/lib/auth/unlock-token";
import { env } from "cloudflare:workers";
import Comments from "@/components/Comments";
import ChapterLockGate from "@/components/ChapterLockGate";

type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      chapter: true,
      volume: true,
      manga: {
        select: {
          title: true,
          coverUrl: true,
          type: true,
        },
      },
    },
  });

  if (!chapter) {
    return {
      title: "Không tìm thấy Chapter - Yoru Translation Group",
    };
  }

  const volStr = chapter.volume !== null ? `Vol. ${chapter.volume} — ` : "";
  const title = `${chapter.manga.title} - ${volStr}Chapter ${chapter.chapter} | Yoru Translation Group`;

  return {
    title,
    description: `Đọc ${chapter.manga.title} ${volStr}Chapter ${chapter.chapter} online tại Yoru Translation Group.`,
    openGraph: {
      title,
      images: chapter.manga.coverUrl ? [{ url: chapter.manga.coverUrl }] : [],
    },
  };
}

export default async function ChapterReaderPage({ params }: PageProps) {
  const { chapterId } = await params;

  // 1 & 2. Kiểm tra session và lấy thông tin chapter song song trong SSR
  const [user, chapter] = await Promise.all([
    getCurrentUser(),
    prisma.chapter.findUnique({
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
    }),
  ]);

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-8 text-center">
            <div className="text-5xl">🔒</div>

            <h1 className="mt-4 text-2xl font-bold">Cần đăng nhập để đọc</h1>

            <p className="mt-3 text-gray-400">
              Bạn cần đăng nhập tài khoản Yoru để tiếp tục đọc truyện.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 font-bold text-white transition hover:opacity-90"
            >
              Đăng nhập
            </Link>

            <Link
              href="/"
              className="mt-3 block text-sm text-gray-500 transition hover:text-gray-300"
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!chapter) {
    notFound();
  }

  // 3. Kiểm tra trạng thái khóa bằng Cookie trong SSR
  const cookieStore = await cookies();

  const isMangaUnlocked =
    !chapter.manga.isLocked ||
    (!!chapter.manga.passwordHash &&
      cookieStore.get(`manga-unlocked-${chapter.manga.id}`)?.value ===
      createUnlockToken(chapter.manga.passwordHash));

  const isChapterUnlocked =
    !chapter.isLocked ||
    (!!chapter.passwordHash &&
      cookieStore.get(`chapter-unlocked-${chapter.id}`)?.value ===
      createUnlockToken(chapter.passwordHash));

  const isLocked = !isMangaUnlocked || !isChapterUnlocked;

  if (isLocked) {
    return (
      <ChapterLockGate
        mangaId={chapter.manga.id}
        chapterId={chapter.id}
        mangaTitle={chapter.manga.title}
        chapterNumber={chapter.chapter}
        isMangaLocked={!isMangaUnlocked}
        passwordHint={
          !isMangaUnlocked
            ? chapter.manga.passwordHint
            : chapter.passwordHint
        }
      />
    );
  }

  // 4. Lấy danh sách chapter để điều hướng Prev / Next
  const chapters = await prisma.chapter.findMany({
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

  // 5. Đọc nội dung Novel từ Cloudflare R2 trong SSR nếu có
  let novelContent = chapter.content || "";

  if (chapter.chapterType === "Novel" && chapter.content) {
    if (
      chapter.content.startsWith("/uploads/") ||
      chapter.content.startsWith("uploads/")
    ) {
      try {
        const objectKey = chapter.content.replace(/^\/?uploads\//, "");
        const novelObject = env.UPLOADS
          ? await env.UPLOADS.get(objectKey)
          : null;

        if (novelObject) {
          novelContent = await novelObject.text();
        }
      } catch (error) {
        console.error("LOAD NOVEL FROM R2 ERROR:", error);
      }
    }
  }

  // 6. Ghi lịch sử đọc & lượt xem
  await Promise.all([
    user
      ? prisma.readingHistory
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
          .catch((err) => console.error("HISTORY LOG ERROR:", err))
      : Promise.resolve(null),

    prisma.mangaView
      .create({
        data: {
          mangaId: chapter.mangaId,
        },
      })
      .catch((err) => console.error("VIEW LOG ERROR:", err)),

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

  // Tính toán Prev/Next Chapter
  const currentIndex = chapters.findIndex((item) => item.id === chapter.id);
  const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-extrabold text-white">
                Yoru Translation Group
              </p>
              <p className="text-xs text-gray-500">Đọc truyện</p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-pink-600 hover:text-pink-400"
          >
            ← Trang chủ
          </Link>
        </div>
      </header>

      {/* THÔNG TIN CHAPTER */}
      <section className="border-b border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center">
          <p className="text-sm font-semibold text-purple-400">
            {chapter.manga.type}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            {chapter.manga.title}
          </h1>

          <p className="mt-2 text-lg font-semibold text-gray-400">
            {chapter.volume !== null
              ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}${chapter.isH ? " - H" : ""}${chapter.isEnd ? " - END" : ""}`
              : `Chapter ${chapter.chapter}${chapter.isH ? " - H" : ""}${chapter.isEnd ? " - END" : ""}`}
          </p>
        </div>
      </section>

      {/* THANH ĐIỀU HƯỚNG */}
      <div className="sticky top-16 z-40 border-b border-gray-900 bg-black/95 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4">
          {previousChapter ? (
            <Link
              href={`/chapter/${previousChapter.id}`}
              className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-purple-900 hover:text-white"
            >
              ← Chap trước
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-xl bg-[#0d0d0d] px-4 py-2 text-sm font-bold text-gray-700">
              ← Chap trước
            </span>
          )}

          <Link
            href={`/manga/${chapter.mangaId}`}
            className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            Danh sách
          </Link>

          {nextChapter ? (
            <Link
              href={`/chapter/${nextChapter.id}`}
              className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-purple-900 hover:text-white"
            >
              Chap sau →
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-xl bg-[#0d0d0d] px-4 py-2 text-sm font-bold text-gray-700">
              Chap sau →
            </span>
          )}
        </div>
      </div>

      {/* NỘI DUNG CHAPTER */}
      <section className="bg-black">
        <div className="mx-auto max-w-5xl">
          {chapter.chapterType === "Novel" && novelContent ? (
            <>
              {/* NỘI DUNG NOVEL */}
              <article className="px-6 py-10 text-base leading-8 text-gray-200 sm:px-10 sm:text-lg">
                <div className="whitespace-pre-wrap select-none text-justify">
                  {novelContent}
                </div>
              </article>

              {/* CRE CUỐI NOVEL */}
              {chapter.images.length > 0 && (
                <div className="yoru-reader-images flex flex-col items-center select-none">
                  {chapter.images.map((image) => (
                    <div key={image.id} className="relative w-full">
                      <img
                        src={image.imageUrl}
                        alt={`${chapter.manga.title} - Chapter ${chapter.chapter} - ${image.fileName}`}
                        className="block h-auto w-full select-none"
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : chapter.images.length === 0 ? (
            /* CHAPTER KHÔNG CÓ NỘI DUNG */
            <div className="px-6 py-20 text-center">
              <p className="mt-4 text-lg font-bold text-gray-300">
                Chapter chưa có nội dung.
              </p>
            </div>
          ) : (
            /* CHAPTER CÓ ẢNH */
            <div className="yoru-reader-images flex flex-col items-center select-none">
              {chapter.images.map((image) => (
                <div key={image.id} className="relative w-full">
                  <img
                    src={image.imageUrl}
                    alt={`${chapter.manga.title} - Chapter ${chapter.chapter} - ${image.fileName}`}
                    className="block h-auto w-full select-none"
                    draggable={false}
                    loading={image.order <= 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CREDIT / CRE CUỐI CHAPTER */}
      {chapter.manga.creditUrl && (
        <section className="border-t border-gray-900 bg-black">
          <div className="yoru-reader-images flex flex-col items-center select-none">
            <img
              src={chapter.manga.creditUrl}
              alt={`${chapter.manga.title} - Credit`}
              className="block h-auto w-full"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      )}

      {/* CUỐI CHAPTER */}
      <section className="border-t border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500">Bạn đã đọc xong</p>

            <h2 className="mt-1 text-xl font-extrabold text-white">
              {chapter.manga.title}
            </h2>

            <p className="mt-1 text-gray-400">
              {chapter.volume !== null
                ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}`
                : `Chapter ${chapter.chapter}`}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            {previousChapter && (
              <Link
                href={`/chapter/${previousChapter.id}`}
                className="rounded-xl border border-gray-700 bg-[#151515] px-6 py-3 text-center font-bold text-gray-200 transition hover:border-purple-600 hover:bg-purple-900/30"
              >
                ← Chapter {previousChapter.chapter}
              </Link>
            )}

            {nextChapter && (
              <Link
                href={`/chapter/${nextChapter.id}`}
                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 text-center font-bold text-white transition hover:opacity-90"
              >
                Chapter {nextChapter.chapter} →
              </Link>
            )}
          </div>

          {!nextChapter && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Bạn đang ở chapter mới nhất.
            </p>
          )}
        </div>
      </section>

      {/* BÌNH LUẬN KHI ĐỌC CHAPTER */}
      <section className="border-t border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Comments mangaId={chapter.manga.id} chapterId={chapter.id} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-900 bg-black px-6 py-8 text-center">
        <p className="font-semibold text-gray-300">Yoru Translation Group</p>
        <p className="mt-1 text-xs text-gray-600">
          © Yoru Translation Group
        </p>
      </footer>
    </main>
  );
}