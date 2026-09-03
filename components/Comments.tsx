"use client";

import { useEffect, useState } from "react";

type CommentUser = {
  id: string;
  username: string;
  avatar: string | null;
  role: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  chapter?: {
    id: string;
    chapter: number;
  } | null;
};

type CommentsProps = {
  mangaId?: string;
  chapterId?: string;
};

export default function Comments({
  mangaId,
  chapterId,
}: CommentsProps) {
  const [comments, setComments] =
    useState<Comment[]>([]);

  const [content, setContent] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadComments() {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

            if (mangaId) {
        params.set("mangaId", mangaId);
      }

      if (chapterId) {
        params.set("scope", "reader");
      } else {
        params.set("scope", "manga");
      }
      const response =
        await fetch(
          `/api/comments?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Không thể tải bình luận."
        );
      }

      setComments(
        Array.isArray(data.comments)
          ? data.comments
          : []
      );
    } catch (error) {
      console.error(
        "LOAD COMMENTS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải bình luận."
      );
    } finally {
      setLoading(false);
    }
  }

   useEffect(() => {
    void loadComments();
  }, [mangaId, chapterId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    try {
      setPosting(true);
      setError("");

      const response =
        await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            content:
              content.trim(),
            mangaId,
            chapterId,
          }),
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Không thể đăng bình luận."
        );
      }

      if (data.comment) {
        setComments(
          (current) => [
            data.comment,
            ...current,
          ]
        );
      }

      setContent("");
    } catch (error) {
      console.error(
        "POST COMMENT ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Không thể đăng bình luận."
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-purple-950">
          Bình luận
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Chia sẻ cảm nhận của bạn về bộ truyện.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8"
      >
        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          maxLength={2000}
          rows={4}
          placeholder="Viết bình luận..."
          className="w-full resize-none rounded-2xl border border-purple-200 bg-purple-50/30 px-4 py-3 text-sm text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="text-xs text-gray-400">
            {content.length}/2000
          </span>

          <button
            type="submit"
            disabled={
              posting ||
              !content.trim()
            }
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting
              ? "Đang đăng..."
              : "Đăng bình luận"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm font-semibold text-purple-500">
          Đang tải bình luận...
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl bg-purple-50 px-5 py-8 text-center text-sm text-purple-500">
          Chưa có bình luận nào.
          Hãy là người đầu tiên bình luận!
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="flex gap-4 border-b border-purple-50 pb-5 last:border-b-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-bold text-white">
                {comment.user.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={
                      comment.user.username
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  comment.user.username
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-purple-900">
                    {comment.user.username}
                  </span>

                  {comment.user.role !==
                    "READER" && (
                    <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold uppercase text-pink-600">
                      {comment.user.role}
                    </span>
                  )}

                                   {chapterId && comment.chapter && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                       Chương {comment.chapter.chapter}
                    </span>
                  )}

                  <span className="text-xs text-gray-400">
                    {new Date(
                      comment.createdAt
                    ).toLocaleString(
                      "vi-VN"
                    )}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {comment.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}