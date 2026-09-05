"use client";

import { FormEvent, useState } from "react";

const PASSWORD_HINT = "Biệt danh trong dis của Yoru **** (viết lại chữ Yoru+bấm cách+****";

export default function UnlockPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/site-lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Mật khẩu không đúng.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
      {/* NỀN MỜ */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-pink-950/30" />

      <div className="absolute inset-0 backdrop-blur-md" />

      {/* KHUNG NHẬP MẬT KHẨU */}
      <section className="relative z-10 w-full max-w-md rounded-3xl border border-purple-300/20 bg-white/95 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.png"
            alt="Yoru Translation Team"
            className="h-20 w-20 rounded-2xl object-contain"
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Nhập mật khẩu
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Website hiện đang được bảo vệ.
            <br />
            Vui lòng nhập mật khẩu để tiếp tục.
          </p>
        </div>

        {/* GỢI Ý */}
        <div className="mt-5 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <span className="font-semibold">Gợi ý:</span>{" "}
          {PASSWORD_HINT}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu..."
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang kiểm tra..." : "Xác nhận"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Yoru Translation Team
        </p>
      </section>
    </main>
  );
}