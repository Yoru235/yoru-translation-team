"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Chapter = {
  id: string;
  chapter: number;
  volume: number | null;
  isLocked: boolean;
  passwordHint: string | null;
};

type Manga = {
  id: string;
  title: string;
  isLocked: boolean;
  passwordHint: string | null;
  originalTitle: string | null;
  author: string | null;
  description: string | null;
  type: string;
  status: string;
  ageRestricted: boolean;
  coverUrl: string | null;
  creditUrl: string | null;
  genres: string[];
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
};

type MangaResponse = {
  success: boolean;
  manga?: Manga;
  error?: string;
};

export default function MangaAdminPage() {
  const params = useParams();

  const mangaId = params.id as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLockForm, setShowLockForm] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockPasswordHint, setLockPasswordHint] = useState("");
  const [isLocking, setIsLocking] = useState(false);
  const [chapterPassword, setChapterPassword] = useState("");
  const [chapterPasswordHint, setChapterPasswordHint] = useState("");
  const [showChapterLockForm, setShowChapterLockForm] = useState(false);
    const handleLockManga = async () => {
  if (!manga) {
    return;
  }

  if (manga.isLocked) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn mở khóa truyện này không?"
    );

    if (!confirmed) return;

    try {
      setIsLocking(true);

      const response = await fetch(
  "/api/admin/lock",
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mangaId: manga.id,
      isLocked: false,
    }),
  }
);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể mở khóa truyện."
        );
      }

      setManga((current) =>
        current
          ? {
              ...current,
              isLocked: false,
              passwordHint: null,
            }
          : current
      );

      setLockPassword("");
      setLockPasswordHint("");
      setShowLockForm(false);

      window.alert("Đã mở khóa truyện.");
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Không thể mở khóa truyện."
      );
    } finally {
      setIsLocking(false);
    }

    return;
  }

  if (!lockPassword.trim()) {
    window.alert("Vui lòng nhập mật khẩu.");
    return;
  }

  try {
    setIsLocking(true);

    const response = await fetch(
      "/api/admin/lock",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mangaId: manga.id,
          isLocked: true,
          password: lockPassword,
          passwordHint: lockPasswordHint,
        }),
      });
    const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(
    data.error || "Không thể khóa truyện."
  );
}

      setManga((current) =>
      current
        ? {
            ...current,
            isLocked: true,
            passwordHint: lockPasswordHint || null,
          }
        : current
    );

    setLockPassword("");
    setShowLockForm(false);

    window.alert("Đã khóa truyện thành công.");
  } catch (err) {
    window.alert(
      err instanceof Error
        ? err.message
        : "Không thể khóa truyện."
    );
  } finally {
    setIsLocking(false);
  }
};

const handleLockChapter = async (chapter: Chapter) => {
  if (!manga) return;

  if (chapter.isLocked) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn mở khóa Chapter ${chapter.chapter} không?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chapterId: chapter.id,
          isLocked: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể mở khóa Chapter."
        );
      }

      setManga((current) =>
        current
          ? {
              ...current,
              chapters: current.chapters.map((item) =>
                item.id === chapter.id
                  ? {
                      ...item,
                      isLocked: false,
                      passwordHint: null,
                    }
                  : item
              ),
            }
          : current
      );

      window.alert("Đã mở khóa Chapter.");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Không thể mở khóa Chapter."
      );
    }

    return;
  }
if (!chapterPassword.trim()) {
  setShowChapterLockForm(true);
  return;
}

try {
  const response = await fetch("/api/admin/lock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chapterId: chapter.id,
      isLocked: true,
      password: chapterPassword,
      passwordHint: chapterPasswordHint,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Không thể khóa Chapter."
    );
  }

  setManga((current) =>
    current
      ? {
          ...current,
          chapters: current.chapters.map((item) =>
            item.id === chapter.id
              ? {
                  ...item,
                  isLocked: true,
                  passwordHint: chapterPasswordHint || null,
                }
              : item
          ),
        }
      : current
  );

  setChapterPassword("");
  setChapterPasswordHint("");
  setShowChapterLockForm(false);

  window.alert("Đã khóa Chapter.");
} catch (error) {
  window.alert(
    error instanceof Error
      ? error.message
      : "Không thể khóa Chapter."
  );
}
 
};
  useEffect(() => {
    if (!mangaId) return;

    const loadManga = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/manga?id=${mangaId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

console.log("MANGA API STATUS:", response.status);
console.log("MANGA API RESPONSE:", text);

if (!text) {
  throw new Error(
    "API manga trả về response rỗng."
  );
}

let data: MangaResponse;

try {
  data = JSON.parse(text) as MangaResponse;
} catch (error) {
  console.error(
    "MANGA API KHÔNG TRẢ JSON:",
    text
  );

  throw new Error(
    "API manga không trả về JSON hợp lệ."
  );
}

        if (!response.ok || !data.success || !data.manga) {
          throw new Error(
            data.error ||
              "Không thể tải thông tin truyện."
          );
        }

        setManga(data.manga);
      } catch (err) {
        console.error(
          "LOAD MANGA DETAIL ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin truyện."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadManga();
  }, [mangaId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="font-semibold text-gray-400">
            Đang tải thông tin truyện...
          </p>
        </div>
      </main>
    );
  }

  if (error || !manga) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center">
            <p className="font-bold text-red-400">
              {error || "Không tìm thấy truyện."}
            </p>

            <a
              href="/admin/manga"
              className="mt-6 inline-block rounded-xl border border-gray-700 px-5 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
            >
              ← Quay lại danh sách truyện
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">

          <div>
            <p className="text-sm font-extrabold text-purple-400">
              Yoru Translation Group
            </p>

            <p className="text-xs text-gray-500">
              Admin
            </p>
          </div>

          <a
            href="/admin/manga"
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
          >
            ← Danh sách truyện
          </a>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* THÔNG TIN TRUYỆN */}

        <section className="rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6">

          <div className="flex flex-col gap-8 md:flex-row">

            {/* COVER */}

            <div className="w-full shrink-0 md:w-56">

              <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-gray-800 bg-[#151515]">

                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-gray-600">
                    Chưa có ảnh bìa
                  </div>
                )}

              </div>

            </div>

            {/* INFO */}

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold text-purple-400">
                {manga.type}
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-white">
                {manga.title}
              </h1>

              {manga.originalTitle && (
                <p className="mt-2 text-sm text-gray-500">
                  {manga.originalTitle}
                </p>
              )}

              {manga.author && (
  <p className="mt-3 text-sm text-gray-400">
    <span className="font-semibold text-gray-500">
      Tác giả:
    </span>{" "}
    {manga.author}
  </p>
)}

              <div className="mt-5 flex flex-wrap gap-2">

                <span className="rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-purple-300">
                  {manga.status}
                </span>

                {manga.ageRestricted && (
                  <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-semibold text-red-400">
                    Giới hạn độ tuổi
                  </span>
                )}

                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-gray-400">
                  {manga.chapters.length} chapter
                </span>

              </div>

              {/* GENRES */}

              {manga.genres.length > 0 && (
                <div className="mt-5">

                  <p className="mb-2 text-sm font-semibold text-gray-400">
                    Thể loại
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {manga.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-gray-800 bg-[#151515] px-3 py-1 text-xs text-gray-400"
                      >
                        {genre}
                      </span>
                    ))}

                  </div>

                </div>
              )}

              {/* DESCRIPTION */}

              {manga.description && (
                <div className="mt-6">

                  <p className="mb-2 text-sm font-semibold text-gray-400">
                    Mô tả
                  </p>

                  <p className="whitespace-pre-line text-sm leading-7 text-gray-500">
                    {manga.description}
                  </p>

                </div>
              )}

              {/* BUTTONS */}

              <div className="mt-7 flex flex-wrap gap-3">

                <a
                  href={`/admin/manga/${manga.id}/edit`}
                  className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  ✏️ Sửa truyện
                </a>

                <a
                  href={`/admin/chapter?mangaId=${manga.id}`}
                  className="rounded-xl border border-purple-700 bg-purple-950/30 px-5 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-900"
                >
                  📖 Thêm chapter
                </a>

<button
  type="button"
  onClick={() => {
    if (manga.isLocked) {
      void handleLockManga();
    } else {
      setShowLockForm((current) => !current);
    }
  }}
  disabled={isLocking}
  className={`rounded-xl border px-5 py-3 text-sm font-bold transition ${
    manga.isLocked
      ? "border-green-800 bg-green-950/30 text-green-400 hover:bg-green-900"
      : "border-yellow-800 bg-yellow-950/30 text-yellow-400 hover:bg-yellow-900"
  } disabled:cursor-not-allowed disabled:opacity-50`}
>
  {isLocking
    ? "⏳ Đang xử lý..."
    : manga.isLocked
      ? "🔓 Mở khóa truyện"
      : "🔒 Khóa truyện"}
</button>
                <button
                  type="button"
                  className="rounded-xl border border-red-900 bg-red-950/20 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-950"
                >
                  🗑️ Xóa truyện
                </button>

              </div>

            </div>

          </div>

        </section>

{showLockForm && !manga.isLocked && (
  <div className="mt-5 rounded-2xl border border-yellow-900 bg-[#111111] p-5">
    <p className="font-bold text-yellow-400">
      🔒 Khóa truyện
    </p>

    <input
      type="password"
      value={lockPassword}
      onChange={(e) => setLockPassword(e.target.value)}
      placeholder="Nhập mật khẩu"
      className="mt-4 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
    />

    <input
      type="text"
      value={lockPasswordHint}
      onChange={(e) => setLockPasswordHint(e.target.value)}
      placeholder="Gợi ý mật khẩu cho người đọc (không bắt buộc)"
      className="mt-3 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
    />

    <button
      type="button"
      onClick={() => void handleLockManga()}
      disabled={isLocking}
      className="mt-4 rounded-xl bg-yellow-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-yellow-600 disabled:opacity-50"
    >
      {isLocking ? "⏳ Đang khóa..." : "🔒 Xác nhận khóa"}
    </button>
  </div>
)}
        {/* CHAPTER */}

        <section className="mt-8">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-2xl font-extrabold">
                Danh sách chapter
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Quản lý các chapter của bộ truyện này.
              </p>
            </div>

            <a
              href={`/admin/chapter?mangaId=${manga.id}`}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              + Thêm chapter
            </a>

          </div>

          {manga.chapters.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-[#0b0b0b] p-12 text-center">

              <p className="font-semibold text-gray-400">
                Chưa có chapter nào.
              </p>

              <a
                href={`/admin/chapter?mangaId=${manga.id}`}
                className="mt-5 inline-block rounded-xl bg-purple-700 px-5 py-2 text-sm font-bold text-white"
              >
                + Tạo chapter đầu tiên
              </a>

            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0b0b]">

              <div className="divide-y divide-gray-800">

                {manga.chapters.map((chapter) => (

                  <div
                    key={chapter.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-[#111111] sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="text-lg font-extrabold text-white">
                        Chapter {chapter.chapter}
                      </p>

{chapter.isLocked && (
  <p className="mt-1 text-xs font-bold text-yellow-400">
    🔒 Chapter đang khóa
  </p>
)}

                      {chapter.volume !== null && (
                        <p className="mt-1 text-sm text-gray-500">
                          Volume {chapter.volume}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <a
                        href={`/chapter/${chapter.id}`}
                        className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
                      >
                        👁️ Xem
                      </a>

                      <a
                        href={`/admin/chapter/${chapter.id}/edit`}
                        className="rounded-xl border border-purple-800 bg-purple-950/30 px-4 py-2 text-sm font-bold text-purple-300 transition hover:bg-purple-900"
                      >
                        ✏️ Sửa
                      </a>
<button
  type="button"
 onClick={() => {
  void handleLockChapter(chapter);
}}
  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
    chapter.isLocked
      ? "border-green-800 bg-green-950/30 text-green-400 hover:bg-green-900"
      : "border-yellow-800 bg-yellow-950/30 text-yellow-400 hover:bg-yellow-900"
  }`}
>
  {chapter.isLocked
    ? "🔓 Mở khóa"
    : "🔒 Khóa"}
</button>
{showChapterLockForm && !chapter.isLocked && (
  <div className="mt-3 w-full rounded-xl border border-yellow-900 bg-[#111111] p-4">
    <p className="font-bold text-yellow-400">
      🔒 Khóa Chapter {chapter.chapter}
    </p>

    <input
      type="password"
      value={chapterPassword}
      onChange={(e) => setChapterPassword(e.target.value)}
      placeholder="Nhập mật khẩu"
      className="mt-3 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
    />

    <input
      type="text"
      value={chapterPasswordHint}
      onChange={(e) => setChapterPasswordHint(e.target.value)}
      placeholder="Gợi ý mật khẩu (không bắt buộc)"
      className="mt-3 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
    />

    <button
      type="button"
      onClick={() => void handleLockChapter(chapter)}
      className="mt-3 rounded-xl bg-yellow-700 px-4 py-2 text-sm font-bold text-white"
    >
      🔒 Xác nhận khóa
    </button>
  </div>
)}
  <button
  type="button"
  onClick={async () => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa Chapter ${chapter.chapter} không?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
  `/api/admin/chapter?id=${chapter.id}`,
  {
    method: "DELETE",
  }
);

const text = await response.text();

console.log("DELETE CHAPTER STATUS:", response.status);
console.log("DELETE CHAPTER RESPONSE:", text);

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
      "API xóa chapter trả về dữ liệu không hợp lệ."
    );
  }
}

if (!response.ok || !data.success) {
  throw new Error(
    data.error || "Không thể xóa chapter."
  );
}

      window.alert("Đã xóa chapter thành công.");

      window.location.reload();
    } catch (error) {
      console.error(
        "DELETE CHAPTER ERROR:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Không thể xóa chapter."
      );
    }
  }}
  className="rounded-xl border border-red-900 bg-red-950/20 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-950"
>
  🗑️ Xóa
</button>

                    </div>

                  </div>

                ))}

              </div>

            </div>
          )}

        </section>

      </div>

    </main>
  );
}