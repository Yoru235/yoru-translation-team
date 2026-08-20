"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Manga = {
  id: string;
  title: string;
  originalTitle: string | null;
  author: string | null;
  description: string | null;
  type: string;
  status: string;
  ageRestricted: boolean;
  coverUrl: string | null;
  creditUrl: string | null;
  genres: string[];
};

type MangaResponse = {
  success: boolean;
  manga?: Manga;
  error?: string;
};

export default function EditMangaPage() {
  const params = useParams();
  const router = useRouter();

  const mangaId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState("Manga");
  const [status, setStatus] = useState("ongoing");

  const [ageRestricted, setAgeRestricted] = useState(false);

  const [coverUrl, setCoverUrl] = useState("");
  const [creditUrl, setCreditUrl] = useState("");

  const [genres, setGenres] = useState("");

  // ==========================================
  // TẢI THÔNG TIN TRUYỆN
  // ==========================================

  useEffect(() => {
    if (!mangaId) return;

    const loadManga = async () => {
      try {
        setIsLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          `/api/admin/manga?id=${mangaId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as MangaResponse;

        if (!response.ok || !data.success || !data.manga) {
          throw new Error(
            data.error ||
              "Không thể tải thông tin truyện."
          );
        }

        const manga = data.manga;

        setTitle(manga.title ?? "");
        setOriginalTitle(manga.originalTitle ?? "");
        setAuthor(manga.author ?? "");
        setDescription(manga.description ?? "");

        setType(manga.type ?? "Manga");
        setStatus(manga.status ?? "ongoing");

        setAgeRestricted(
          manga.ageRestricted ?? false
        );

        setCoverUrl(manga.coverUrl ?? "");
        setCreditUrl(manga.creditUrl ?? "");

        setGenres(
          Array.isArray(manga.genres)
            ? manga.genres.join(", ")
            : ""
        );
      } catch (err) {
        console.error(
          "LOAD EDIT MANGA ERROR:",
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

  // ==========================================
  // LƯU THAY ĐỔI
  // ==========================================

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!mangaId) {
        setError("Thiếu ID truyện.");
        setIsSaving(false);
        return;
      }

      if (!title.trim()) {
        setError("Tên truyện không được để trống.");
        setIsSaving(false);
        return;
      }

      const genreList = genres
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean);

      const response = await fetch(
        `/api/admin/manga?id=${mangaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // QUAN TRỌNG: gửi ID truyện lên API
            id: mangaId,

            title: title.trim(),

            originalTitle:
              originalTitle.trim() || null,

            author:
  author.trim() || null,

            description:
              description.trim() || null,

            type: type.trim(),

            status: status.trim(),

            ageRestricted,

            coverUrl:
              coverUrl.trim() || null,

            creditUrl:
              creditUrl.trim() || null,

            genres: genreList,
          }),
        }
      );

      const data =
        (await response.json()) as MangaResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể lưu thay đổi truyện."
        );
      }

      setSuccess(
        "Đã lưu thay đổi truyện thành công."
      );

      setTimeout(() => {
        router.push(
          `/admin/manga/${mangaId}`
        );

        router.refresh();
      }, 700);
    } catch (err) {
      console.error(
        "SAVE MANGA ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu thay đổi truyện."
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
            Đang tải thông tin truyện...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR KHI KHÔNG TẢI ĐƯỢC TRUYỆN
  // ==========================================

  if (error && !title) {
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
                router.push(
                  `/admin/manga/${mangaId}`
                )
              }
              className="mt-6 rounded-xl border border-gray-700 px-5 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-400"
            >
              ← Quay lại truyện
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // FORM EDIT
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
              Sửa truyện
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/manga/${mangaId}`
              )
            }
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
          >
            ← Quay lại
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* THÔNG BÁO LỖI */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/20 p-5">
            <p className="font-bold text-red-400">
              ❌ {error}
            </p>
          </div>
        )}

        {/* THÔNG BÁO THÀNH CÔNG */}

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
              Thông tin truyện
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Chỉnh sửa thông tin của bộ truyện.
            </p>
          </div>

          <div className="space-y-6">

            {/* TÊN TRUYỆN */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Tên truyện *
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Nhập tên truyện"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            {/* TÊN GỐC */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Tên gốc
              </label>

              <input
                type="text"
                value={originalTitle}
                onChange={(event) =>
                  setOriginalTitle(
                    event.target.value
                  )
                }
                placeholder="Tên tiếng Trung, Hàn, Nhật..."
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

{/* TÁC GIẢ */}

<div>
  <label className="mb-2 block text-sm font-bold text-gray-300">
    Tác giả
  </label>

  <input
    type="text"
    value={author}
    onChange={(event) =>
      setAuthor(event.target.value)
    }
    placeholder="Nhập tên tác giả..."
    className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
  />
</div>
            {/* LOẠI + TRẠNG THÁI */}

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">
                  Loại truyện
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none focus:border-purple-600"
                >
                  <option value="Manga">
                    Manga
                  </option>

                  <option value="Manhwa">
                    Manhwa
                  </option>

                  <option value="Manhua">
                    Manhua
                  </option>

                  <option value="Comic">
                    Comic
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">
                  Trạng thái
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none focus:border-purple-600"
                >
                  <option value="ongoing">
                    Đang tiến hành
                  </option>

                  <option value="completed">
                    Đã hoàn thành
                  </option>

                  <option value="hiatus">
                    Tạm ngưng
                  </option>
                </select>
              </div>

            </div>

            {/* MÔ TẢ */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Mô tả
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Nhập mô tả truyện..."
                rows={7}
                className="w-full resize-y rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            {/* THỂ LOẠI */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Thể loại
              </label>

              <input
                type="text"
                value={genres}
                onChange={(event) =>
                  setGenres(event.target.value)
                }
                placeholder="Ví dụ: Action, BL, Drama, Fantasy"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

              <p className="mt-2 text-xs text-gray-600">
                Nếu có nhiều thể loại, ngăn cách bằng dấu phẩy.
              </p>
            </div>

            {/* COVER */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Cover URL
              </label>

              <input
                type="text"
                value={coverUrl}
                onChange={(event) =>
                  setCoverUrl(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

              {coverUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500">
                    Xem trước ảnh bìa
                  </p>

                  <div className="h-48 w-32 overflow-hidden rounded-xl border border-gray-800 bg-[#151515]">
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CREDIT */}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Credit URL
              </label>

              <input
                type="text"
                value={creditUrl}
                onChange={(event) =>
                  setCreditUrl(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            {/* GIỚI HẠN TUỔI */}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-800 bg-[#111111] p-4 transition hover:border-purple-900">

              <input
                type="checkbox"
                checked={ageRestricted}
                onChange={(event) =>
                  setAgeRestricted(
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-purple-600"
              />

              <div>
                <p className="font-bold text-gray-300">
                  Giới hạn độ tuổi
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  Đánh dấu nếu truyện có giới hạn độ tuổi.
                </p>
              </div>

            </label>

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-800 pt-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/manga/${mangaId}`
                )
              }
              disabled={isSaving}
              className="rounded-xl border border-gray-700 bg-[#151515] px-6 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
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