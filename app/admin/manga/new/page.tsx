"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UploadType =
  | "cover"
  | "credit";

export default function NewMangaPage() {
  const router = useRouter();

  const coverInputRef =
    useRef<HTMLInputElement>(null);

  const creditInputRef =
    useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("Manga");
  const [status, setStatus] = useState("ongoing");
  const [description, setDescription] =
    useState("");

  const [coverUrl, setCoverUrl] =
    useState("");

  const [creditUrl, setCreditUrl] =
    useState("");

  const [isUploadingCover, setIsUploadingCover] =
    useState(false);

  const [isUploadingCredit, setIsUploadingCredit] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // UPLOAD ẢNH LÊN R2
  // ==========================================

  const uploadImage = async (
    file: File,
    uploadType: UploadType
  ) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("type", uploadType);

    const response = await fetch(
      "/api/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      throw new Error(
        text ||
          "Server trả về lỗi khi upload ảnh."
      );
    }
const data = (await response.json()) as any;

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          "Không thể upload ảnh."
      );
    }

    return data.imageUrl as string;
  };

  // ==========================================
  // CHỌN ẢNH
  // ==========================================

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    uploadType: UploadType
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setError("");

      if (
        !file.type.startsWith("image/")
      ) {
        throw new Error(
          "Vui lòng chọn file ảnh."
        );
      }

      if (uploadType === "cover") {
        setIsUploadingCover(true);
      } else {
        setIsUploadingCredit(true);
      }

      const imageUrl =
        await uploadImage(
          file,
          uploadType
        );

      if (uploadType === "cover") {
        setCoverUrl(imageUrl);
      } else {
        setCreditUrl(imageUrl);
      }

    } catch (err) {
      console.error(
        "UPLOAD IMAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể upload ảnh."
      );
    } finally {
      if (uploadType === "cover") {
        setIsUploadingCover(false);
      } else {
        setIsUploadingCredit(false);
      }

      event.target.value = "";
    }
  };

  // ==========================================
  // TẠO TRUYỆN
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Vui lòng nhập tên truyện."
      );

      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        "/api/admin/manga",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title: title.trim(),

            author:
              author.trim() || null,

            type,

            status,

            description:
              description.trim(),

            coverUrl:
              coverUrl || null,

            creditUrl:
              creditUrl || null,
          }),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Server trả về lỗi khi tạo truyện."
        );
      }

      const data =
  (await response.json()) as any;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Không thể thêm truyện."
        );
      }

      router.push(
        "/admin/manga"
      );

      router.refresh();

    } catch (err) {
      console.error(
        "CREATE MANGA ERROR:",
        err
      );

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
                setTitle(
                  event.target.value
                )
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
                setAuthor(
                  event.target.value
                )
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
                  setType(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-700 bg-[#0b0b0b] px-4 py-3 text-white outline-none focus:border-purple-600"
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

                <option value="Novel">
                  Novel
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
                  setStatus(
                    event.target.value
                  )
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

          {/* ẢNH BÌA */}

          <div>

            <label className="mb-2 block text-sm font-bold text-gray-300">
              Ảnh bìa
            </label>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(event) =>
                void handleImageChange(
                  event,
                  "cover"
                )
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                coverInputRef.current?.click()
              }
              disabled={isUploadingCover}
              className="rounded-xl border border-purple-700 bg-purple-950/30 px-5 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-900/40 disabled:opacity-50"
            >
              {isUploadingCover
                ? "⏳ Đang upload ảnh bìa..."
                : "🖼️ Chọn ảnh bìa"}
            </button>

            {coverUrl && (

              <div className="mt-4">

                <p className="mb-2 text-xs text-green-400">
                  ✅ Ảnh bìa đã upload lên R2
                </p>

                <div className="h-64 w-44 overflow-hidden rounded-xl border border-gray-700 bg-black">

                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />

                </div>

              </div>

            )}

          </div>

          {/* CREDIT */}

          <div>

            <label className="mb-2 block text-sm font-bold text-gray-300">
              Ảnh Credit cuối chapter
            </label>

            <input
              ref={creditInputRef}
              type="file"
              accept="image/*"
              onChange={(event) =>
                void handleImageChange(
                  event,
                  "credit"
                )
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                creditInputRef.current?.click()
              }
              disabled={isUploadingCredit}
              className="rounded-xl border border-pink-700 bg-pink-950/30 px-5 py-3 text-sm font-bold text-pink-300 transition hover:bg-pink-900/40 disabled:opacity-50"
            >
              {isUploadingCredit
                ? "⏳ Đang upload Credit..."
                : "🎨 Chọn ảnh Credit"}
            </button>

            {creditUrl && (

              <div className="mt-4">

                <p className="mb-2 text-xs text-green-400">
                  ✅ Credit đã upload lên R2
                </p>

                <div className="max-w-md overflow-hidden rounded-xl border border-gray-700 bg-black">

                  <img
                    src={creditUrl}
                    alt="Credit preview"
                    className="max-h-80 w-full object-contain"
                  />

                </div>

              </div>

            )}

          </div>

          {/* DESCRIPTION */}

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
              disabled={
                isSaving ||
                isUploadingCover ||
                isUploadingCredit
              }
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