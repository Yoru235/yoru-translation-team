"use client";

import { useState } from "react";
import Link from "next/link";

export type ChapterItem = {
  id: string;
  chapter: number;
  volume: number | null;
  isH: boolean;
  isEnd: boolean;
  createdAt: string | Date;
};

type ChapterListProps = {
  chapters: ChapterItem[];
};

export default function ChapterList({ chapters }: ChapterListProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  if (!chapters || chapters.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-[#0d0d0d] p-10 text-center">
        <p className="text-lg font-bold text-gray-300">Chưa có chapter.</p>
        <p className="mt-2 text-sm text-gray-600">
          Truyện này chưa được đăng chapter nào.
        </p>
      </div>
    );
  }

  const sortedChapters = [...chapters].sort((a, b) => {
    if (sortOrder === "newest") {
      return b.chapter - a.chapter;
    } else {
      return a.chapter - b.chapter;
    }
  });

  return (
    <div>
      {/* HEADER DANH SÁCH & NÚT SẮP XẾP */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Danh sách chapter ({chapters.length})
          </h2>
          <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
        </div>

        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
          }
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#111111] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-purple-600 hover:text-white cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <span>
            Sắp xếp: {sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}
          </span>
        </button>
      </div>

      {/* DANH SÁCH CHAPTER CÓ SCROLL */}
      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1 text-left scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-gray-900">
        {sortedChapters.map((chapter) => {
          const dateStr = new Date(chapter.createdAt).toLocaleDateString(
            "vi-VN",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }
          );

          return (
            <Link
              key={chapter.id}
              href={`/chapter/${chapter.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-[#111111] px-5 py-3.5 transition hover:border-purple-600 hover:bg-purple-950/30"
            >
              <div>
                <p className="font-bold text-gray-200">
                  {chapter.volume !== null
                    ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}`
                    : `Chapter ${chapter.chapter}`}

                  {chapter.isH && (
                    <span className="ml-2 text-purple-400">- H</span>
                  )}

                  {chapter.isEnd && (
                    <span className="ml-2 text-pink-400">- END</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Đăng ngày: {dateStr}
                </p>
              </div>

              <span className="text-sm font-bold text-purple-400">Đọc →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
