import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MangaLockGate from "@/components/MangaLockGate";
import BookmarkButton from "@/components/BookmarkButton";
import RatingStars from "@/app/components/RatingStars";
import Comments from "@/components/Comments";
type PageProps = {
  params: Promise<{
    mangaId: string;
  }>;
};

export default async function MangaPage({
  params,
}: PageProps) {
  const { mangaId } = await params;

  const manga = await prisma.manga.findUnique({
    where: {
      id: mangaId,
    },
    include: {
    translationGroup: true,
      chapters: {
        orderBy: {
          chapter: "asc",
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!manga) {
    notFound();
  }
  await prisma.manga.update({
  where: {
    id: manga.id,
  },
  data: {
    views: {
      increment: 1,
    },
  },
});

  const cookieStore = await cookies();

const unlockCookie = cookieStore.get(
  `manga_unlocked_${manga.id}`
);

const isMangaUnlocked =
  unlockCookie?.value === "true";

if (manga.isLocked && !isMangaUnlocked) {
  return (
    <MangaLockGate
      mangaId={manga.id}
      title={manga.title}
      passwordHint={manga.passwordHint}
    />
  );
}
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-10 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="font-extrabold text-white">
                Yoru Translation Group
              </p>

              <p className="text-xs text-gray-500">
                Đọc truyện
              </p>
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

      {/* THÔNG TIN TRUYỆN */}

      <section className="border-b border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-10">

          <div className="flex flex-col gap-8 md:flex-row">

            {/* COVER */}

            <div className="shrink-0 md:w-64">

              {manga.coverUrl ? (
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="mx-auto w-full max-w-64 rounded-2xl object-cover shadow-2xl"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full max-w-64 items-center justify-center rounded-2xl bg-[#151515] text-gray-500">
                  Chưa có ảnh bìa
                </div>
              )}

            </div>

            {/* INFO */}

            <div className="flex-1">

              <p className="text-sm font-semibold text-purple-400">
                {manga.type}
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                {manga.title}
              </h1>

              {manga.originalTitle && (
                <p className="mt-2 text-sm text-gray-500">
                  {manga.originalTitle}
                </p>
              )}

{manga.author && (
  <p className="mt-3 text-sm text-gray-400">
    <span className="font-semibold text-gray-500">
      Tác giả:
    </span>{" "}
    {manga.author}
  </p>
)}
<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

  {manga.translationGroup && (
    <div className="rounded-xl border border-gray-800 bg-[#111111] px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">
        Nhóm dịch
      </p>
      <p className="mt-1 font-semibold text-purple-400">
        {manga.translationGroup.name}
      </p>
    </div>
  )}

  {manga.releaseDate && (
    <div className="rounded-xl border border-gray-800 bg-[#111111] px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">
        Ngày phát hành
      </p>
      <p className="mt-1 font-semibold text-gray-200">
        {new Date(manga.releaseDate).toLocaleDateString("vi-VN")}
      </p>
    </div>
  )}

  <div className="rounded-xl border border-gray-800 bg-[#111111] px-4 py-3">
    <p className="text-xs font-semibold text-gray-500">
      Lượt xem
    </p>
    <p className="mt-1 font-semibold text-gray-200">
      {manga.views.toLocaleString("vi-VN")}
    </p>
  </div>

  <div className="rounded-xl border border-gray-800 bg-[#111111] px-4 py-3">
  <RatingStars
    mangaId={manga.id}
    initialRating={manga.rating}
  />
</div>

</div>
              <div className="mt-5 flex flex-wrap gap-2">

                <span className="rounded-full bg-purple-900/50 px-3 py-1 text-sm text-purple-200">
                  {manga.status}
                </span>

                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-[#171717] px-3 py-1 text-sm text-gray-300"
                  >
                    {genre}
                  </span>
                ))}

              </div>

              {manga.description && (
                <p className="mt-6 whitespace-pre-line leading-7 text-gray-300">
                  {manga.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">

                {manga.chapters.length > 0 && (
                  <Link
                    href={`/chapter/${manga.chapters[0].id}`}
                    className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 font-bold text-white transition hover:opacity-90"
                  >
                    Đọc từ đầu →
                  </Link>
                )}
<BookmarkButton mangaId={manga.id} />
                {manga.creditUrl && (
                  <a
                    href={manga.creditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-gray-700 bg-[#111111] px-6 py-3 font-bold text-gray-200 transition hover:border-purple-600"
                  >
                    Nguồn truyện
                  </a>
                )}

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* DANH SÁCH CHAPTER */}

      <section className="mx-auto max-w-5xl px-4 py-10">

        <div className="mb-6">

          <h2 className="text-2xl font-extrabold text-white">
            Danh sách chapter
          </h2>

          <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />

        </div>

        {manga.chapters.length === 0 ? (

          <div className="rounded-2xl border border-gray-800 bg-[#0d0d0d] p-10 text-center">

            <p className="text-lg font-bold text-gray-300">
              Chưa có chapter.
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Truyện này chưa được đăng chapter nào.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {manga.chapters.map((chapter) => (

              <Link
                key={chapter.id}
                href={`/chapter/${chapter.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#111111] px-5 py-4 transition hover:border-purple-600 hover:bg-purple-950/30"
              >

                <div>

                  <p className="font-bold text-gray-200">
  {chapter.volume !== null
    ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}`
    : `Chapter ${chapter.chapter}`}

  {chapter.isH && (
    <span className="ml-2 text-purple-400">
      - H
    </span>
  )}

  {chapter.isEnd && (
    <span className="ml-2 text-pink-400">
      - END
    </span>
  )}
</p>

                  <p className="mt-1 text-xs text-gray-500">
                    {chapter.images.length} trang
                  </p>

                </div>

                <span className="text-sm font-bold text-purple-400">
                  Đọc →
                </span>

              </Link>

            ))}

          </div>

        )}

      </section>
            {/* COMMENTS */}

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <Comments mangaId={manga.id} />
      </section>

      {/* FOOTER */}

      <footer className="border-t border-gray-900 bg-black px-6 py-8 text-center">

        <p className="font-semibold text-gray-300">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-xs text-gray-600">
          © 2026 Yoru Translation Group
        </p>

      </footer>

    </main>
  );
}