"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMangaUrl } from "@/lib/manga-url";

export type NavChapterItem = {
  id: string;
  chapter: number;
  volume: number | null;
  title: string | null;
  isH: boolean;
  isEnd: boolean;
  isLocked: boolean;
};

type ChapterReaderNavProps = {
  currentChapterId: string;
  mangaId: string;
  mangaTitle: string;
  mangaType: string;
  previousChapter: { id: string; chapter: number } | null;
  nextChapter: { id: string; chapter: number } | null;
  chapters: NavChapterItem[];
};

export default function ChapterReaderNav({
  currentChapterId,
  mangaId,
  mangaType,
  previousChapter,
  nextChapter,
  chapters,
}: ChapterReaderNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const activeChapterRef = useRef<HTMLAnchorElement | null>(null);

  // Tìm chapter hiện tại
  const currentChapter = useMemo(
    () => chapters.find((c) => c.id === currentChapterId),
    [chapters, currentChapterId]
  );

  // Sắp xếp danh sách chapter từ mới nhất đến cũ nhất (như trong ảnh mẫu)
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => b.chapter - a.chapter);
  }, [chapters]);

  // Cuộn tới chapter hiện tại khi mở modal và khóa cuộn body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        if (activeChapterRef.current) {
          activeChapterRef.current.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }
      }, 50);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Phím tắt bàn phím tiện lợi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      } else if (e.key === "ArrowLeft" && previousChapter && !isOpen) {
        router.push(`/chapter/${previousChapter.id}`);
      } else if (e.key === "ArrowRight" && nextChapter && !isOpen) {
        router.push(`/chapter/${nextChapter.id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, previousChapter, nextChapter, router]);

  const currentLabel = currentChapter
    ? `Chapter ${currentChapter.chapter}`
    : "Chọn Chapter";

  return (
    <>
      {/* THANH ĐIỀU HƯỚNG DẠNG FLOATING PILL */}
      <div className="sticky top-16 z-40 flex justify-center py-2 px-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 rounded-full border border-purple-900/40 bg-[#120d22]/90 p-1 backdrop-blur-md shadow-xl shadow-black/70 text-sm">
          {/* NÚT TRANG CHỦ / MANGA DETAIL */}
          <Link
            href={getMangaUrl({ id: mangaId, type: mangaType })}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1634] text-purple-300 transition hover:bg-purple-900/50 hover:text-white"
            title="Trang chi tiết truyện"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>

          {/* NÚT PREV */}
          {previousChapter ? (
            <Link
              href={`/chapter/${previousChapter.id}`}
              className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-300 transition hover:bg-purple-900/40 hover:text-white"
            >
              Prev
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-600">
              Prev
            </span>
          )}

          {/* NÚT CHỌN CHAPTER Ở GIỮA */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-purple-800 to-pink-700 hover:from-purple-700 hover:to-pink-600 px-5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md border border-purple-400/30 transition hover:scale-[1.02] active:scale-95"
          >
            <span>{currentLabel}</span>
          </button>

          {/* NÚT NEXT */}
          {nextChapter ? (
            <Link
              href={`/chapter/${nextChapter.id}`}
              className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-300 transition hover:bg-purple-900/40 hover:text-white"
            >
              Next
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-600">
              Next
            </span>
          )}
        </div>
      </div>

      {/* POPUP / MODAL CHỌN CHAPTER DẠNG DANH SÁCH RADIO */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop mờ nền */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Hộp danh sách Chapter */}
          <div className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-purple-900/50 bg-[#120d24] text-white shadow-2xl shadow-purple-950/60 max-h-[80vh]">
            {/* Header popup */}
            <div className="flex items-center justify-between border-b border-purple-950/40 px-5 py-3.5 bg-[#17112e]">
              <span className="text-sm font-bold text-purple-300">
                Mục lục chapter ({sortedChapters.length})
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-purple-900/40 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Danh sách Chapter có scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-purple-950/30 scrollbar-thin scrollbar-thumb-purple-900/60 scrollbar-track-[#0e0a1b]">
              {sortedChapters.map((item) => {
                const isCurrent = item.id === currentChapterId;

                return (
                  <a
                    key={item.id}
                    ref={isCurrent ? activeChapterRef : null}
                    href={`/chapter/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-5 py-3.5 text-sm transition ${
                      isCurrent
                        ? "bg-purple-950/50 text-white font-bold"
                        : "text-gray-300 hover:bg-purple-900/20 hover:text-white"
                    }`}
                  >
                    {/* Tên Chapter */}
                    <div className="flex items-center gap-2">
                      <span>
                        {item.volume !== null
                          ? `Vol. ${item.volume} — Chapter ${item.chapter}`
                          : `Chapter ${item.chapter}`}
                      </span>

                      {item.isH && (
                        <span className="rounded bg-pink-900/60 border border-pink-700/40 px-1 py-0.2 text-[10px] text-pink-300 font-semibold">
                          18+
                        </span>
                      )}

                      {item.isEnd && (
                        <span className="rounded bg-purple-900/60 border border-purple-700/40 px-1 py-0.2 text-[10px] text-purple-300 font-semibold">
                          END
                        </span>
                      )}

                      {item.isLocked && (
                        <span className="text-[11px]" title="Có mật khẩu">
                          🔒
                        </span>
                      )}
                    </div>

                    {/* Radio circle indicator (như trong ảnh mẫu) */}
                    <div className="flex items-center justify-center shrink-0">
                      {isCurrent ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]">
                          <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-600 transition group-hover:border-gray-400" />
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
