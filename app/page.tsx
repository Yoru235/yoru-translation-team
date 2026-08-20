"use client";

import { useEffect, useState } from "react";

type Manga = {
  id: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
  type: string;
  status: string;
  ageRestricted: boolean;
  coverUrl: string | null;
  creditUrl: string | null;
  genres: string[];
};

type MangaApiResponse = {
  success: boolean;
  mangas?: Manga[];
  error?: string;
};

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMangas = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/admin/manga", {
          method: "GET",
          cache: "no-store",
        });

        const data =
          (await response.json()) as MangaApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Không thể tải danh sách truyện."
          );
        }

        if (!cancelled) {
          setMangaList(
            Array.isArray(data.mangas)
              ? data.mangas
              : []
          );
        }
      } catch (error) {
        console.error(
          "LOAD MANGA ERROR:",
          error
        );

        if (!cancelled) {
          setMangaList([]);
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

  const filteredManga = mangaList.filter((manga) =>
    manga.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main
      className={`min-h-screen font-sans ${
        darkMode
          ? "bg-gradient-to-b from-[#12091a] via-[#1d0d27] to-[#28102a] text-white"
          : "bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] text-purple-950"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#4b176d] via-[#8e278f] to-[#d13b91] shadow-lg">
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-4 px-6">

          {/* LOGO + TÊN NHÓM */}

          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-12 w-auto object-contain"
            />

            <span className="text-xl font-extrabold text-white">
              Yoru Translation Group
            </span>
          </div>

          {/* TÌM KIẾM + DARK MODE + ĐĂNG NHẬP */}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm truyện..."
              className="w-32 rounded-xl border border-white/30 bg-white px-4 py-2 text-sm text-purple-950 outline-none placeholder:text-purple-400 focus:ring-2 focus:ring-pink-300 sm:w-52"
            />

            <button
              type="button"
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="rounded-xl bg-white/20 px-3 py-2 text-lg text-white backdrop-blur transition hover:bg-white/30"
              title="Đổi giao diện"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* ĐĂNG NHẬP */}

            <button
              type="button"
              className="rounded-xl bg-white px-4 py-2 font-bold text-purple-700 shadow-md transition hover:scale-105 hover:bg-purple-50"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
        className={`shadow-md ${
          darkMode
            ? "bg-gradient-to-r from-[#35134a] via-[#55165e] to-[#711652]"
            : "bg-gradient-to-r from-[#551b78] via-[#8b258e] to-[#bd2688]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-6 py-4">

          <a
            href="#"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Trang chủ
          </a>

          <a
            href="#manga"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Manga
          </a>

          <a
            href="#manhwa"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Manhwa
          </a>

          <a
            href="#manhua"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Manhua
          </a>

<a
  href="#novel"
  className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
>
  Novel
</a>
          <a
            href="#ongoing"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Đang tiến hành
          </a>

          <a
            href="#completed"
            className="whitespace-nowrap font-bold text-white transition hover:text-pink-200"
          >
            Đã hoàn thành
          </a>
        </div>
      </nav>

      {/* =====================================================
          BANNER
      ===================================================== */}

      <section className="mx-auto mt-7 max-w-7xl px-6">
        <div className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-r from-[#592080] via-[#9b269c] to-[#e23891] shadow-xl">

          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 to-transparent" />

          <div className="relative flex h-full items-center px-10">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-pink-100">
                Yoru Translation Group
              </p>

              <h2 className="text-4xl font-extrabold text-white md:text-5xl">
                Thế giới truyện tranh
              </h2>

              <p className="mt-4 text-lg text-purple-100">
                Manga · Manhwa · Manhua
              </p>

              <button
                type="button"
                className="mt-6 rounded-xl bg-white px-6 py-3 font-bold text-purple-700 shadow-lg transition hover:scale-105"
              >
                Khám phá truyện →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TRUYỆN NỔI BẬT
      ===================================================== */}

      <section
        id="manga"
        className="mx-auto mt-12 max-w-7xl px-6"
      >
        <div className="mb-7 flex items-end justify-between">

          <div>
            <h2
              className={
                darkMode
                  ? "text-4xl font-extrabold text-pink-200"
                  : "text-4xl font-extrabold text-[#75257f]"
              }
            >
              Truyện nổi bật
            </h2>

            <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          </div>

          <button
            type="button"
            className={
              darkMode
                ? "hidden rounded-xl border border-purple-700 bg-[#24152f] px-5 py-2 text-sm font-semibold text-pink-200 shadow-sm hover:bg-purple-900 sm:block"
                : "hidden rounded-xl border border-purple-200 bg-white px-5 py-2 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-50 sm:block"
            }
          >
            Xem tất cả →
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-purple-600">
              Đang tải truyện...
            </p>
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-purple-600">
              Chưa có truyện nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {filteredManga
              .slice(0, 4)
              .map((manga) => (
                <a
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className={
                    darkMode
                      ? "group overflow-hidden rounded-2xl border border-purple-900 bg-[#24152f] shadow-lg transition duration-300 hover:-translate-y-2"
                      : "group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                  }
                >
                  <div className="overflow-hidden bg-purple-100">

                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-purple-100 text-purple-400">
                        Chưa có ảnh bìa
                      </div>
                    )}
                  </div>

                  <div className="p-4">

                    <h3
                      className={
                        darkMode
                          ? "text-lg font-extrabold text-white"
                          : "text-lg font-extrabold text-purple-900"
                      }
                    >
                      {manga.title}
                    </h3>

                    <p
                      className={
                        darkMode
                          ? "mt-1 text-sm text-purple-300"
                          : "mt-1 text-sm text-purple-500"
                      }
                    >
                      {manga.type}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-2">

                      <p className="text-sm font-semibold text-pink-500">
                        ❤️ 0 lượt xem
                      </p>

                      <span
                        className={
                          darkMode
                            ? "rounded-full bg-purple-900 px-3 py-1 text-xs font-medium text-pink-200"
                            : "rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600"
                        }
                      >
                        {manga.status}
                      </span>

                    </div>
                  </div>
                </a>
              ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MỚI CẬP NHẬT
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div className="mb-7 flex items-center justify-between">

          <div>
            <h2
              className={
                darkMode
                  ? "text-3xl font-extrabold text-pink-200"
                  : "text-3xl font-extrabold text-purple-900"
              }
            >
              Mới cập nhật
            </h2>

            <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          </div>

          <button
            type="button"
            className={
              darkMode
                ? "rounded-xl bg-purple-900 px-4 py-2 text-sm font-semibold text-pink-200 hover:bg-purple-800"
                : "rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200"
            }
          >
            Xem thêm →
          </button>
        </div>

        <div className="grid gap-4">

          {filteredManga
            .slice(0, 3)
            .map((manga) => (
              <a
                key={`update-${manga.id}`}
                href={`/manga/${manga.id}`}
                className={
                  darkMode
                    ? "flex items-center gap-4 rounded-2xl border border-purple-900 bg-[#24152f] p-4 shadow"
                    : "flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm"
                }
              >
                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="h-24 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-20 items-center justify-center rounded-xl bg-purple-100 text-xs text-purple-400">
                    No cover
                  </div>
                )}

                <div className="flex-1">

                  <h3
                    className={
                      darkMode
                        ? "font-bold text-pink-200"
                        : "font-bold text-purple-800"
                    }
                  >
                    {manga.title}
                  </h3>

                  <p
                    className={
                      darkMode
                        ? "mt-1 text-sm text-purple-300"
                        : "mt-1 text-sm text-purple-500"
                    }
                  >
                    {manga.type}
                  </p>

                  <p className="mt-2 text-sm text-pink-500">
                    ❤️ 0 lượt xem
                  </p>
                </div>

                <span
                  className={
                    darkMode
                      ? "hidden rounded-full bg-purple-900 px-3 py-1 text-xs font-semibold text-pink-200 sm:block"
                      : "hidden rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 sm:block"
                  }
                >
                  {manga.status}
                </span>
              </a>
            ))}

        </div>
      </section>

      {/* =====================================================
          TRUYỆN HOT
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-fuchsia-700 to-pink-600 p-8 shadow-xl">

          <h2 className="text-3xl font-extrabold text-white">
            Truyện Hot
          </h2>

          <p className="mt-2 text-purple-100">
            Những bộ truyện đang được độc giả quan tâm.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {filteredManga
              .slice(0, 4)
              .map((manga) => (
                <a
                  key={`hot-${manga.id}`}
                  href={`/manga/${manga.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-2"
                >
                  {manga.coverUrl ? (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="h-60 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-60 items-center justify-center bg-purple-100 text-purple-400">
                      Chưa có ảnh bìa
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="font-bold text-purple-900">
                      {manga.title}
                    </h3>

                    <p className="mt-2 text-sm text-pink-500">
                      ❤️ 0 lượt xem
                    </p>

                  </div>
                </a>
              ))}

          </div>
        </div>
      </section>

      {/* =====================================================
          THỂ LOẠI
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div
          className={
            darkMode
              ? "rounded-3xl border border-purple-900 bg-[#24152f] p-8"
              : "rounded-3xl border border-purple-100 bg-white/70 p-8"
          }
        >

          <h2
            className={
              darkMode
                ? "text-3xl font-extrabold text-pink-200"
                : "text-3xl font-extrabold text-purple-900"
            }
          >
            Khám phá theo thể loại
          </h2>

          <p
            className={
              darkMode
                ? "mt-2 text-purple-300"
                : "mt-2 text-purple-500"
            }
          >
            Tìm bộ truyện phù hợp với bạn.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              className="rounded-full bg-purple-100 px-5 py-2 font-semibold text-purple-700 hover:bg-purple-200"
            >
              Manga
            </button>

            <button
              type="button"
              className="rounded-full bg-fuchsia-100 px-5 py-2 font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
            >
              Manhwa
            </button>

            <button
              type="button"
              className="rounded-full bg-pink-100 px-5 py-2 font-semibold text-pink-700 hover:bg-pink-200"
            >
              Manhua
            </button>

            <button
              type="button"
              className="rounded-full bg-purple-100 px-5 py-2 font-semibold text-purple-700 hover:bg-purple-200"
            >
              Đã hoàn thành
            </button>

            <button
              type="button"
              className="rounded-full bg-fuchsia-100 px-5 py-2 font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
            >
              Đang tiến hành
            </button>

          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mt-20 bg-gradient-to-r from-[#4b176d] via-[#812681] to-[#c9328d] px-6 py-10 text-center text-white">

        <img
          src="/logo.png"
          alt="Yoru Translation Group"
          className="mx-auto mb-4 h-20 w-auto object-contain"
        />

        <h3 className="text-xl font-bold">
          Yoru Translation Group
        </h3>

        <p className="mt-2 text-sm text-purple-100">
          Manga · Manhwa · Manhua
        </p>

        <p className="mt-5 text-xs text-purple-200">
          © 2026 Yoru Translation Team. All rights reserved.
        </p>

        <p className="mt-2 text-sm text-purple-100">
          Fanpage:{" "}
          <a
            href="https://www.facebook.com/share/1BW7DS6RdZ/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline transition hover:text-white"
          >
            Yoru Translation Group
          </a>
        </p>

      </footer>
    </main>
  );
}