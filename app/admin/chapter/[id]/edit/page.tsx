"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Chapter = {
  id: string;
  chapter: number;
  volume: number | null;
  mangaId: string;
};

type ChapterResponse = {
  success: boolean;
  chapter?: Chapter;
  error?: string;
};

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();

  const chapterId = params.id as string;

  const [chapter, setChapter] = useState("");
  const [volume, setVolume] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // TẢI THÔNG TIN CHAPTER
  // ==========================================

  useEffect(() => {
    if (!chapterId) {
      setError("Thiếu ID chapter.");
      setIsLoading(false);
      return;
    }

    const loadChapter = async () => {
      try {
        setIsLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/admin/chapter?id=${chapterId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as ChapterResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.chapter
        ) {
          throw new Error(
            data.error ||
              "Không thể tải thông tin chapter."
          );
        }

        setChapter(
          String(data.chapter.chapter)
        );

        setVolume(
          data.chapter.volume !== null
            ? String(data.chapter.volume)
            : ""
        );
      } catch (err) {
        console.error(
          "LOAD EDIT CHAPTER ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin chapter."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadChapter();
  }, [chapterId]);

  // ==========================================
  // LƯU CHAPTER
  // ==========================================

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!chapterId) {
        setError("Thiếu ID chapter.");
        setIsSaving(false);
        return;
      }

      if (!chapter.trim()) {
        setError(
          "Số chapter không được để trống."
        );
        setIsSaving(false);
        return;
      }

      const chapterNumber =
        Number(chapter);

      if (
        !Number.isFinite(chapterNumber) ||
        chapterNumber < 0
      ) {
        setError(
          "Số chapter không hợp lệ."
        );
        setIsSaving(false);
        return;
      }

      let volumeNumber: number | null = null;

      if (volume.trim()) {
        const parsedVolume =
          Number(volume);

        if (
          !Number.isFinite(parsedVolume) ||
          parsedVolume < 0
        ) {
          setError(
            "Số volume không hợp lệ."
          );
          setIsSaving(false);
          return;
        }

        volumeNumber = parsedVolume;
      }

      const response = await fetch(
        `/api/admin/chapter?id=${chapterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: chapterId,
            chapter: chapterNumber,
            volume: volumeNumber,
          }),
        }
      );

      const data =
        (await response.json()) as ChapterResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Không thể lưu chapter."
        );
      }

      setSuccess(
        "Đã lưu chapter thành công."
      );

      setTimeout(() => {
        if (data.chapter?.mangaId) {
          router.push(
            `/admin/manga/${data.chapter.mangaId}`
          );
        } else {
          router.back();
        }

        router.refresh();
      }, 700);
    } catch (err) {
      console.error(
        "SAVE CHAPTER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu chapter."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="font-semibold text-gray-400">
            Đang tải thông tin chapter...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !chapter) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center">
            <p className="font-bold text-red-400">
              ❌ {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="mt-6 rounded-xl border border-gray-700 px-5 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // FORM
  // ==========================================

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-purple-900 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-6">

          <div>
            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="text-2xl font-extrabold">
              Sửa chapter
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            disabled={isSaving}
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300 disabled:opacity-50"
          >
            ← Quay lại
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/20 p-5">
            <p className="font-bold text-red-400">
              ❌ {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-900 bg-green-950/20 p-5">
            <p className="font-bold text-green-400">
              ✅ {success}
            </p>
          </div>
        )}

        {/* FORM */}

        <section className="rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6">

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold">
              Thông tin chapter
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Chỉnh sửa số chapter và volume.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* CHAPTER */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Số chapter *
              </label>

              <input
                type="number"
                step="0.1"
                min="0"
                value={chapter}
                onChange={(event) =>
                  setChapter(
                    event.target.value
                  )
                }
                placeholder="Ví dụ: 1"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            {/* VOLUME */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Volume
              </label>

              <input
                type="number"
                step="1"
                min="0"
                value={volume}
                onChange={(event) =>
                  setVolume(
                    event.target.value
                  )
                }
                placeholder="Ví dụ: 1"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

              <p className="mt-2 text-xs text-gray-600">
                Có thể để trống nếu chapter không thuộc volume cụ thể.
              </p>
            </div>

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-800 pt-6">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              disabled={isSaving}
              className="rounded-xl border border-gray-700 bg-[#151515] px-6 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-7 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "⏳ Đang lưu..."
                : "💾 Lưu thay đổi"}
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}