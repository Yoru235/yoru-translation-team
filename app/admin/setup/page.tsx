"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupOwnerPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreateOwner = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!email.trim() || !username.trim() || !password) {
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      if (password.length < 8) {
        setError("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
      }

      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tạo tài khoản OWNER."
        );
      }

      setSuccess(
        "Đã tạo tài khoản OWNER thành công. Bạn sẽ được chuyển đến trang đăng nhập."
      );

      setEmail("");
      setUsername("");
      setPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error("SETUP OWNER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo tài khoản OWNER."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Tạo tài khoản OWNER
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Tạo tài khoản quản trị chính cho hệ thống.
            </p>
          </div>

          <section className="rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6">

            {error && (
              <div className="mb-5 rounded-xl border border-red-900 bg-red-950/20 p-4">
                <p className="text-sm font-bold text-red-400">
                  ❌ {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-green-900 bg-green-950/20 p-4">
                <p className="text-sm font-bold text-green-400">
                  ✅ {success}
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="YoruOwner"
                autoComplete="username"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-300">
                Mật khẩu
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ít nhất 8 ký tự"
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleCreateOwner()}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "⏳ Đang tạo..."
                : "👑 Tạo tài khoản OWNER"}
            </button>

          </section>

        </div>
      </div>
    </main>
  );
}