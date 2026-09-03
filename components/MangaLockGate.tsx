"use client";

import { useState } from "react";

type Props = {
  mangaId: string;
  title: string;
  passwordHint: string | null;
};

export default function MangaLockGate({
  mangaId,
  title,
  passwordHint,
}: Props) {
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsUnlocking(true);
    setError("");

    try {
      const response = await fetch("/api/manga/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mangaId,
          password,
        }),
      });

      const data = await response.json();

     if (!response.ok || !data.success) {
  throw new Error(
    data.error || "Mật khẩu không đúng."
  );
}

localStorage.setItem(
  `manga-unlocked-${mangaId}`,
  "true"
);

window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể mở khóa truyện."
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-yellow-900 bg-[#111111] p-8">

          <div className="text-center">
            <div className="text-5xl">🔒</div>

            <h1 className="mt-4 text-2xl font-bold">
              Truyện đang bị khóa
            </h1>

            <p className="mt-3 text-gray-400">
              Nhập mật khẩu để tiếp tục đọc:
            </p>

            <p className="mt-2 font-bold text-white">
              {title}
            </p>

            {passwordHint && (
              <p className="mt-4 text-sm text-yellow-400">
                Gợi ý: {passwordHint}
              </p>
            )}
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleUnlock();
              }
            }}
            placeholder="Nhập mật khẩu"
            className="mt-6 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
          />

          {error && (
            <p className="mt-3 text-sm font-semibold text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleUnlock()}
            disabled={isUnlocking}
            className="mt-4 w-full rounded-xl bg-yellow-700 px-5 py-3 font-bold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlocking
              ? "⏳ Đang kiểm tra..."
              : "🔓 Mở khóa truyện"}
          </button>

          <a
            href="/"
            className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-300"
          >
            ← Về trang chủ
          </a>

        </div>
      </div>
    </main>
  );
}