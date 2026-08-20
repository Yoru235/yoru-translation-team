"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  manga: {
    id: string;
    title: string;
  } | null;
  chapter: {
    id: string;
    chapter: number;
  } | null;
};

type CommentsResponse = {
  success: boolean;
  comments?: Comment[];
  error?: string;
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/comments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as CommentsResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể tải danh sách bình luận."
        );
      }

      setComments(data.comments ?? []);
    } catch (err) {
      console.error(
        "LOAD ADMIN COMMENTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách bình luận."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (
    commentId: string
  ) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa bình luận này không?\n\nHành động này không thể hoàn tác."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(commentId);
      setError("");

      const response = await fetch(
        `/api/admin/comments?id=${commentId}`,
        {
          method: "DELETE",
        }
      );

      const text = await response.text();

      let data: {
        success?: boolean;
        error?: string;
      } = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "API xóa bình luận trả về dữ liệu không hợp lệ."
          );
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Không thể xóa bình luận."
        );
      }

      setComments((currentComments) =>
        currentComments.filter(
          (comment) => comment.id !== commentId
        )
      );
    } catch (err) {
      console.error(
        "DELETE COMMENT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa bình luận."
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void loadComments();
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
              Quản lý bình luận
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
            Bình luận
          </h2>

          <p className="mt-2 text-gray-500">
            Quản lý các bình luận của người đọc
            trong hệ thống.
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section>
        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* THỐNG KÊ */}

          <div className="mb-8 rounded-2xl border border-purple-900 bg-[#111111] p-5">
            <p className="text-sm text-gray-500">
              Tổng số bình luận
            </p>

            <p className="mt-2 text-3xl font-extrabold text-purple-400">
              {comments.length}
            </p>
          </div>

          {/* LOADING */}

          {isLoading && (
            <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-20 text-center">
              <p className="font-semibold text-gray-400">
                Đang tải bình luận...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!isLoading && error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/20 px-6 py-10 text-center">
              <p className="font-bold text-red-400">
                ❌ {error}
              </p>

              <button
                type="button"
                onClick={() => void loadComments()}
                className="mt-5 rounded-xl bg-red-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* KHÔNG CÓ BÌNH LUẬN */}

          {!isLoading &&
            !error &&
            comments.length === 0 && (
              <div className="rounded-2xl border border-gray-800 bg-[#111111] px-6 py-20 text-center">
                <p className="text-xl font-bold text-gray-300">
                  Chưa có bình luận nào
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Khi người đọc bình luận, nội dung
                  sẽ xuất hiện ở đây.
                </p>
              </div>
            )}

          {/* DANH SÁCH BÌNH LUẬN */}

          {!isLoading &&
            !error &&
            comments.length > 0 && (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-gray-800 bg-[#111111] p-5 transition hover:border-purple-800 hover:bg-[#151515]"
                  >
                    <div className="flex flex-col gap-5">

                      {/* USER + TIME */}

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-extrabold text-white">
                            👤 {comment.user.username}
                          </p>

                          <p className="mt-1 text-xs text-gray-600">
                            {comment.user.email}
                          </p>
                        </div>

                        <p className="text-xs text-gray-600">
                          {new Date(
                            comment.createdAt
                          ).toLocaleString("vi-VN")}
                        </p>
                      </div>

                      {/* TRUYỆN */}

                      <div className="rounded-xl border border-gray-800 bg-[#0b0b0b] p-4">
                        <p className="text-sm font-bold text-purple-400">
                          📖{" "}
                          {comment.manga?.title ||
                            "Không xác định"}
                        </p>

                        {comment.chapter && (
                          <p className="mt-1 text-xs text-gray-500">
                            Chapter{" "}
                            {comment.chapter.chapter}
                          </p>
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="rounded-xl bg-[#151515] p-4">
                        <p className="whitespace-pre-line text-sm leading-7 text-gray-300">
                          {comment.content}
                        </p>
                      </div>

                      {/* ACTION */}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteComment(
                              comment.id
                            )
                          }
                          disabled={
                            deletingId === comment.id
                          }
                          className="rounded-xl border border-red-900 bg-red-950/20 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === comment.id
                            ? "⏳ Đang xóa..."
                            : "🗑️ Xóa bình luận"}
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>
    </main>
  );
}