import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { toMediaUrl } from "@/lib/media";
import { getMangaUrl } from "@/lib/manga-url";

export const metadata: Metadata = {
  title: "Bookmark — Yoru Translation Group",
  description: "Danh sách truyện bạn đã Bookmark tại Yoru Translation Group.",
};

export default async function BookmarkPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] px-6 py-10 text-purple-950">
        <div className="mx-auto max-w-7xl">
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow">
            <div className="mb-3 text-5xl">🔒</div>

            <h2 className="text-xl font-bold text-purple-900">
              Cần đăng nhập
            </h2>

            <p className="mt-2 text-purple-600">
              Bạn cần đăng nhập để xem danh sách Bookmark của mình.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 font-bold text-white transition hover:opacity-90"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let bookmarks: Array<{
    id: string;
    manga: {
      id: string;
      title: string;
      coverUrl: string | null;
      type: string;
      status: string;
    };
  }> = [];

  let error = "";

  try {
    bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      include: {
        manga: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (err) {
    console.error("SSR LOAD BOOKMARK ERROR:", err);
    error = "Không thể tải danh sách Bookmark.";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] px-6 py-10 text-purple-950">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-extrabold text-[#75257f]">🔖 Bookmark</h1>

        <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />

        {error ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow">
            <p className="font-semibold text-red-500">{error}</p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow">
            <p className="font-semibold text-purple-600">
              Bạn chưa Bookmark truyện nào.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {bookmarks.map((bookmark) => {
              const manga = bookmark.manga;

              return (
                <Link
                  key={bookmark.id}
                  href={getMangaUrl(manga)}
                  className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md transition hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="overflow-hidden bg-purple-100">
                    {manga.coverUrl ? (
                      <img
                        src={toMediaUrl(manga.coverUrl)}
                        alt={manga.title}
                        className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center text-purple-400">
                        Chưa có ảnh bìa
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="text-lg font-extrabold text-purple-900">
                      {manga.title}
                    </h2>

                    <p className="mt-1 text-sm text-purple-500">{manga.type}</p>

                    <span className="mt-3 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
                      {manga.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}