"use client";

import { useEffect, useState } from "react";

type Manga = {
  id: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
};

type MangaResponse = {
  success: boolean;
  mangas?: Manga[];
  error?: string;
};

export default function MangaListPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMangas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/manga",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as MangaResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Không thể tải danh sách truyện."
          );
        }

        if (!cancelled) {
          setMangas(data.mangas ?? []);
        }
      } catch (err) {
        console.error(
          "LOAD MANGA LIST ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách truyện."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMangas();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4">

          <a
            href="/"
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-10 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="font-extrabold">
                Yoru Translation Group
              </p>

              <p className="text-xs text-gray-500">
                Đọc truyện
              </p>
            </div>
          </a>

          <a
            href="/"
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
          >
            ← Trang chủ
          </a>

        </div>
      </header>

      {/* TITLE */}

      <section className="border-b border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-6xl px-4 py-8">

          <h1 className="text-3xl font-extrabold">
            Danh sách truyện
          </h1>

          <p className="mt-2 text-gray-500">
            Tất cả truyện của Yoru Translation Group
          </p>

        </div>
      </section>

      {/* CONTENT */}

      <section>
        <div className="mx-auto max-w-6xl px-4 py-10">

          {isLoading && (
            <div className="py-20 text-center">
              <p className="font-semibold text-gray-400">
                Đang tải danh sách truyện...
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/20 px-6 py-10 text-center">
              <p className="font-bold text-red-400">
                {error}
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            mangas.length === 0 && (
              <div className="rounded-2xl border border-gray-800 bg-[#0b0b0b] px-6 py-16 text-center">
                <p className="font-semibold text-gray-400">
                  Chưa có truyện nào.
                </p>
              </div>
            )}

          {!isLoading &&
            !error &&
            mangas.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                {mangas.map((manga) => (
                  <a
                    key={manga.id}
                    href={`/manga/${manga.id}`}
                    className="group overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0b0b] transition hover:-translate-y-1 hover:border-purple-700"
                  >

                    <div className="aspect-[2/3] overflow-hidden bg-[#151515]">

                      {manga.coverUrl ? (
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-sm text-gray-600">
                          Chưa có ảnh bìa
                        </div>
                      )}

                    </div>

                    <div className="p-3">

                      <p className="line-clamp-2 font-bold text-gray-200">
                        {manga.title}
                      </p>

                      <p className="mt-1 text-xs text-purple-400">
                        {manga.type}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {manga.status}
                      </p>

                    </div>

                  </a>
                ))}

              </div>
            )}

        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-gray-900 bg-[#080808] px-6 py-8 text-center">

        <p className="font-semibold text-gray-300">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-xs text-gray-600">
          © Yoru Translation Group
        </p>

      </footer>

    </main>
  );
}