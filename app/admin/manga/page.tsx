"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Manga = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  type: string;
  status: string;
};

type MangaResponse = {
  success: boolean;
  mangas?: Manga[];
  error?: string;
};

export default function AdminMangaPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ==========================================
  // TRẠNG THÁI XÓA TRUYỆN
  // ==========================================

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMangas = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/manga", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as MangaResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tải danh sách truyện."
        );
      }

      setMangas(data.mangas ?? []);
    } catch (err) {
      console.error("LOAD ADMIN MANGA ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách truyện."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // XÓA TRUYỆN
  // ==========================================

  const handleDeleteManga = async (mangaId: string) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa truyện này không?\n\nHành động này không thể hoàn tác."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(mangaId);
      setError("");

      const response = await fetch(
        `/api/admin/manga?id=${mangaId}`,
        {
          method: "DELETE",
        }
      );

      const text = await response.text();

      console.log(
        "DELETE MANGA STATUS:",
        response.status
      );

      console.log(
        "DELETE MANGA RESPONSE:",
        text
      );

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "API xóa truyện trả về dữ liệu không hợp lệ."
          );
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể xóa truyện."
        );
      }

      // Xóa truyện khỏi danh sách hiện tại
      setMangas((currentMangas) =>
        currentMangas.filter(
          (manga) => manga.id !== mangaId
        )
      );
    } catch (err) {
      console.error(
        "DELETE MANGA ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa truyện."
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void loadMangas();
  }, []);

  // ==========================================
  // TÌM KIẾM + LỌC TRẠNG THÁI
  // ==========================================

  const filteredMangas = mangas.filter((manga) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      manga.title.toLowerCase().includes(keyword) ||
      (manga.author ?? "").toLowerCase().includes(keyword) ||
      manga.type.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" ||
      manga.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-purple-900 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-6">
          <div>
            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="text-2xl font-extrabold">
              Quản lý truyện
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
            >
              ← Dashboard
            </Link>

            <Link
              href="/admin/manga/new"
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              + Thêm truyện
            </Link>
          </div>
        </div>
      </header>

      {/* TITLE */}

      <section className="border-b border-gray-900 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h2 className="text-3xl font-extrabold">
            Danh sách truyện
          </h2>

          <p className="mt-2 text-gray-500">
            Quản lý các bộ truyện đang có trong hệ thống.
          </p>

          {/* TÌM KIẾM */}

          <div className="mt-6">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="🔎 Tìm theo tên truyện, tác giả hoặc loại..."
              className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section>
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* THỐNG KÊ NHANH */}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-purple-900 bg-[#111111] p-5">
              <p className="text-sm text-gray-500">
                Tổng số truyện
              </p>

              <p className="mt-2 text-3xl font-extrabold text-purple-400">
                {mangas.length}
              </p>
            </div>

            <div className="rounded-2xl border border-pink-900 bg-[#111111] p-5">
              <p className="text-sm text-gray-500">
                Đang tiến hành
              </p>

              <p className="mt-2 text-3xl font-extrabold text-pink-400">
                {
                  mangas.filter(
                    (manga) =>
                      manga.status.toLowerCase() ===
                      "ongoing"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-fuchsia-900 bg-[#111111] p-5">
              <p className="text-sm text-gray-500">
                Đã hoàn thành
              </p>

              <p className="mt-2 text-3xl font-extrabold text-fuchsia-400">
                {
                  mangas.filter(
                    (manga) =>
                      manga.status.toLowerCase() ===
                      "completed"
                  ).length
                }
              </p>
            </div>
          </div>

          {/* LOADING */}

          {isLoading && (
            <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-20 text-center">
              <p className="font-semibold text-gray-400">
                Đang tải danh sách truyện...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!isLoading && error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/20 px-6 py-10 text-center">
              <p className="font-bold text-red-400">
                ❌ {error}
              </p>

              <button
                type="button"
                onClick={() => void loadMangas()}
                className="mt-5 rounded-xl bg-red-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* KHÔNG CÓ TRUYỆN */}

          {!isLoading &&
            !error &&
            mangas.length === 0 && (
              <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-20 text-center">
                <p className="text-xl font-bold text-gray-300">
                  Chưa có truyện nào
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Hãy thêm bộ truyện đầu tiên.
                </p>

                <Link
                  href="/admin/manga/new"
                  className="mt-6 inline-block rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white"
                >
                  + Thêm truyện
                </Link>
              </div>
            )}

          {/* DANH SÁCH */}

          {!isLoading &&
            !error &&
            mangas.length > 0 && (
              <>
                {/* BỘ LỌC TRẠNG THÁI */}

                <div className="mb-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter("all")
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${
                      statusFilter === "all"
                        ? "bg-purple-700 text-white"
                        : "border border-gray-700 bg-[#111111] text-gray-400"
                    }`}
                  >
                    Tất cả
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter("ongoing")
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${
                      statusFilter === "ongoing"
                        ? "bg-purple-700 text-white"
                        : "border border-gray-700 bg-[#111111] text-gray-400"
                    }`}
                  >
                    Đang tiến hành
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter("completed")
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${
                      statusFilter === "completed"
                        ? "bg-purple-700 text-white"
                        : "border border-gray-700 bg-[#111111] text-gray-400"
                    }`}
                  >
                    Đã hoàn thành
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter("hiatus")
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${
                      statusFilter === "hiatus"
                        ? "bg-purple-700 text-white"
                        : "border border-gray-700 bg-[#111111] text-gray-400"
                    }`}
                  >
                    Tạm ngưng
                  </button>
                </div>

                {/* KẾT QUẢ KHÔNG TÌM THẤY */}

                {filteredMangas.length === 0 ? (
                  <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-16 text-center">
                    <p className="text-xl font-bold text-gray-300">
                      Không tìm thấy truyện
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMangas.map((manga) => (
                      <div
                        key={manga.id}
                        className="rounded-2xl border border-gray-800 bg-[#111111] p-5 transition hover:border-purple-800 hover:bg-[#151515]"
                      >
                        <div className="flex flex-col gap-5 md:flex-row md:items-center">
                          {/* COVER */}

                          <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#1b1b1b]">
                            {manga.coverUrl ? (
                              <img
                                src={manga.coverUrl}
                                alt={manga.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-600">
                                Chưa có ảnh bìa
                              </div>
                            )}
                          </div>

                          {/* THÔNG TIN */}

                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-extrabold text-white">
                              {manga.title}
                            </h3>

                            {manga.author && (
                              <p className="mt-2 text-sm font-semibold text-gray-400">
                                ✍️ {manga.author}
                              </p>
                            )}

                            <p className="mt-2 text-sm font-semibold text-purple-400">
                              {manga.type}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-purple-300">
                                {manga.status}
                              </span>

                              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs text-gray-500">
                                ID: {manga.id}
                              </span>
                            </div>
                          </div>

                          {/* NÚT */}

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/manga/${manga.id}`}
                              className="rounded-xl border border-gray-700 bg-[#151515] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
                            >
                              Xem
                            </Link>

                            <Link
                              href={`/admin/manga/${manga.id}`}
                              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              Quản lý
                            </Link>

                            {/* XÓA TRUYỆN */}

                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteManga(
                                  manga.id
                                )
                              }
                              disabled={
                                deletingId === manga.id
                              }
                              className="rounded-xl border border-red-900 bg-red-950/20 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === manga.id
                                ? "⏳ Đang xóa..."
                                : "🗑️ Xóa"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>
      </section>
    </main>
  );
}