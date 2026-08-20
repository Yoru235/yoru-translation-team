"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewMangaPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("Manga");
  const [status, setStatus] = useState("ongoing");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tên truyện.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch("/api/admin/manga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || null,
          type,
          status,
          description: description.trim(),
          coverUrl: coverUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể thêm truyện."
        );
      }

      router.push("/admin/manga");
      router.refresh();
    } catch (err) {
      console.error("CREATE MANGA ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể thêm truyện."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="mt-1 text-3xl font-extrabold">
              Thêm truyện
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Tạo một bộ truyện mới trong hệ thống.
            </p>
          </div>

          <Link
            href="/admin/manga"
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-purple-600 hover:text-purple-300"
          >
            ← Quay lại
          </Link>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm font-semibold text-red-400">
            ❌ {error}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-800 bg-[#111111] p-6"
        >

          {/* TÊN */}

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Tên truyện
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Nhập tên truyện..."
              className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
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
    className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
  />
</div>
          {/* TYPE + STATUS */}

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Loại truyện
              </label>

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none focus:border-purple-600"
              >
                <option value="Manga">Manga</option>
                <option value="Manhwa">Manhwa</option>
                <option value="Manhua">Manhua</option>
                <option value="Novel">Novel</option>
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
                className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none focus:border-purple-600"
              >
                <option value="ongoing">
                  Đang tiến hành
                </option>

                <option value="completed">
                  Đã hoàn thành
                </option>
              </select>
            </div>

          </div>

          {/* COVER */}

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Link ảnh bìa
            </label>

            <input
              type="text"
              value={coverUrl}
              onChange={(event) =>
                setCoverUrl(event.target.value)
              }
              placeholder="/covers/example.jpg"
              className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
            />

            <p className="mt-2 text-xs text-gray-600">
              Tạm thời dùng đường dẫn ảnh. Sau này mình sẽ làm
              upload ảnh trực tiếp.
            </p>
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Mô tả
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={6}
              placeholder="Nhập mô tả truyện..."
              className="w-full resize-none rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
            />
          </div>

          {/* BUTTON */}

          <div className="flex justify-end gap-3 border-t border-gray-800 pt-6">

            <Link
              href="/admin/manga"
              className="rounded-xl border border-gray-700 bg-[#151515] px-5 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500"
            >
              Hủy
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "⏳ Đang lưu..."
                : "+ Thêm truyện"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}

