"use client";

import { useEffect, useState } from "react";

type Props = {
  mangaId: string;
};

export default function BookmarkButton({ mangaId }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBookmark() {
      try {
        const response = await fetch("/api/bookmarks", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setLoading(false);
          return;
        }

        const found = data.bookmarks?.some(
          (bookmark: { mangaId: string }) =>
            bookmark.mangaId === mangaId
        );

        setBookmarked(Boolean(found));
      } catch (error) {
        console.error("LOAD BOOKMARK ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadBookmark();
  }, [mangaId]);

  async function handleBookmark() {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mangaId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể cập nhật bookmark."
        );
      }

      setBookmarked(Boolean(data.bookmarked));
      setMessage(data.message || "");
    } catch (error) {
      console.error("BOOKMARK ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật bookmark."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-xl border border-gray-700 bg-[#111111] px-6 py-3 font-bold text-gray-500"
      >
        Đang kiểm tra...
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleBookmark()}
        disabled={saving}
        className={`rounded-xl border px-6 py-3 font-bold transition ${
          bookmarked
            ? "border-purple-600 bg-purple-950/40 text-purple-300"
            : "border-gray-700 bg-[#111111] text-gray-200 hover:border-purple-600 hover:text-purple-300"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {saving
          ? "Đang cập nhật..."
          : bookmarked
          ? "Đã lưu truyện"
          : "Lưu truyện"}
      </button>

      {message && (
        <p className="mt-2 text-xs text-gray-500">
          {message}
        </p>
      )}
    </div>
  );
}