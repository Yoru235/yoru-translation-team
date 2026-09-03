"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TopManga = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  views: number;
};

type Statistics = {
  totalViews: number;
  todayViews: number;
  views7Days: number;
  views30Days: number;
  totalMangas: number;
  totalChapters: number;
};

type StatisticsResponse = {
  success: boolean;
  statistics?: Statistics;
  topMangas?: TopManga[];
  error?: string;
};

export default function AdminStatisticsPage() {
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [topMangas, setTopMangas] =
    useState<TopManga[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/statistics",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as StatisticsResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.statistics
        ) {
          throw new Error(
            data.error ||
              "Không thể tải thống kê."
          );
        }

        setStatistics(data.statistics);
        setTopMangas(data.topMangas ?? []);
      } catch (err) {
        console.error(
          "LOAD STATISTICS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thống kê."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadStatistics();
  }, []);

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
              Thống kê
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* TITLE */}

      <section className="border-b border-gray-900 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h2 className="text-3xl font-extrabold">
            Thống kê hệ thống
          </h2>

          <p className="mt-2 text-gray-500">
            Theo dõi lượt xem và tình hình hoạt động
            của các bộ truyện.
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section>
        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* LOADING */}

          {isLoading && (
            <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-20 text-center">
              <p className="font-semibold text-gray-400">
                Đang tải thống kê...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!isLoading && error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/20 px-6 py-10 text-center">
              <p className="font-bold text-red-400">
                ❌ {error}
              </p>
            </div>
          )}

          {/* STATISTICS */}

          {!isLoading &&
            !error &&
            statistics && (
              <>
                {/* VIEW STATISTICS */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-2xl border border-purple-900 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      Tổng lượt xem
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-purple-400">
                      {statistics.totalViews.toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-pink-900 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      Lượt xem hôm nay
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-pink-400">
                      {statistics.todayViews.toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-fuchsia-900 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      7 ngày qua
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-fuchsia-400">
                      {statistics.views7Days.toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-900 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      30 ngày qua
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-violet-400">
                      {statistics.views30Days.toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>

                </div>

                {/* CONTENT STATISTICS */}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-2xl border border-gray-800 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      Tổng số truyện
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {statistics.totalMangas}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-[#111111] p-5">
                    <p className="text-sm text-gray-500">
                      Tổng số chapter
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {statistics.totalChapters}
                    </p>
                  </div>

                </div>

                {/* TOP MANGA */}

                <section className="mt-10">

                  <div className="mb-5">
                    <h2 className="text-2xl font-extrabold">
                      Truyện được xem nhiều nhất
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Xếp hạng dựa trên tổng lượt xem.
                    </p>
                  </div>

                  {topMangas.length === 0 ? (
                    <div className="rounded-2xl border border-gray-800 bg-[#111111] p-10 text-center">
                      <p className="font-semibold text-gray-500">
                        Chưa có dữ liệu lượt xem.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">

                      {topMangas.map(
                        (manga, index) => (
                          <div
                            key={manga.id}
                            className="rounded-2xl border border-gray-800 bg-[#111111] p-5 transition hover:border-purple-800 hover:bg-[#151515]"
                          >
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                              {/* RANK */}

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-950 text-lg font-extrabold text-purple-300">
                                {index + 1}
                              </div>

                              {/* COVER */}

                              <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#1b1b1b]">
                                {manga.coverUrl ? (
                                  <img
                                    src={manga.coverUrl}
                                    alt={manga.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-600">
                                    Không có ảnh
                                  </div>
                                )}
                              </div>

                              {/* INFO */}

                              <div className="min-w-0 flex-1">

                                <h3 className="text-xl font-extrabold text-white">
                                  {manga.title}
                                </h3>

                                {manga.author && (
                                  <p className="mt-2 text-sm text-gray-400">
                                    ✍️ {manga.author}
                                  </p>
                                )}

                                <p className="mt-3 text-sm font-bold text-purple-400">
                                  👁️{" "}
                                  {manga.views.toLocaleString(
                                    "vi-VN"
                                  )}{" "}
                                  lượt xem
                                </p>

                              </div>

                              {/* BUTTON */}

                              <Link
                                href={`/admin/manga/${manga.id}`}
                                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:opacity-90"
                              >
                                Quản lý
                              </Link>

                            </div>
                          </div>
                        )
                      )}

                    </div>
                  )}

                </section>
              </>
            )}
        </div>
      </section>
    </main>
  );
}