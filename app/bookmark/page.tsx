"use client";

import { useEffect, useState } from "react";

type BookmarkManga = {
  id: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
};

type Bookmark = {
  id: string;
  createdAt: string;
  manga: BookmarkManga;
};

type BookmarkResponse = {
  success: boolean;
  bookmarks?: Bookmark[];
  error?: string;
};

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/bookmarks/list", {
          method: "GET",
          cache: "no-store",
        });

        const data =
          (await response.json()) as BookmarkResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Không thể tải Bookmark."
          );
        }

        setBookmarks(
          Array.isArray(data.bookmarks)
            ? data.bookmarks
            : []
        );
      } catch (error) {
        console.error("LOAD BOOKMARK ERROR:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải Bookmark."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadBookmarks();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] px-6 py-10 text-purple-950">
      <div className="mx-auto max-w-7xl">

        <h1 className="text-4xl font-extrabold text-[#75257f]">
          🔖 Bookmark
        </h1>

        <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />

        {isLoading ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow">
            <p className="font-semibold text-purple-600">
              Đang tải Bookmark...
            </p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow">
            <p className="font-semibold text-red-500">
              {error}
            </p>
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
                <a
                  key={bookmark.id}
                  href={`/manga/${manga.id}`}
                  className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md transition hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="overflow-hidden bg-purple-100">

                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
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

                    <p className="mt-1 text-sm text-purple-500">
                      {manga.type}
                    </p>

                    <span className="mt-3 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
                      {manga.status}
                    </span>

                  </div>
                </a>
              );
            })}

          </div>
        )}
      </div>
    </main>
  );
}