"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HistoryItem = {
  id: string;
  readAt: string;
  manga: {
    id: string;
    title: string;
    coverUrl: string | null;
    type: string;
    status: string;
  };
  chapter: {
    id: string;
    chapter: number;
    volume: number | null;
  };
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/history", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Không thể tải lịch sử đọc."
          );
        }

        setHistory(data.history || []);
      } catch (error) {
        console.error("LOAD HISTORY ERROR:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải lịch sử đọc."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
             Lịch sử đọc
          </h1>

          <p className="mt-2 text-gray-500">
            Những chapter bạn đã đọc gần đây.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              Đang tải lịch sử đọc...
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mb-3 text-5xl">📖</div>

            <h2 className="text-xl font-semibold text-gray-800">
              Chưa có lịch sử đọc
            </h2>

            <p className="mt-2 text-gray-500">
              Các chapter bạn đọc sẽ xuất hiện ở đây.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-2.5 text-white transition hover:opacity-80"
            >
              Khám phá truyện
            </Link>
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                  {item.manga.coverUrl ? (
                    <img
                      src={item.manga.coverUrl}
                      alt={item.manga.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-gray-900">
                    {item.manga.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.manga.type} · {item.manga.status}
                  </p>

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Chapter {item.chapter.chapter}
                    {item.chapter.volume !== null &&
                      ` · Volume ${item.chapter.volume}`}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Đọc lúc: {formatDate(item.readAt)}
                  </p>

                  <Link
                    href={`/chapter/${item.chapter.id}`}
                    className="mt-3 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80"
                  >
                    Đọc tiếp
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}