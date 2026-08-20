"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!email.trim() || !password) {
        setError("Vui lòng nhập email và mật khẩu.");
        return;
      }

      console.log("LOGIN DATA:", {
  email: email.trim(),
  hasPassword: Boolean(password),
});
      const response = await fetch("/api/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Đăng nhập không thành công."
        );
      }

      if (!data.user) {
        throw new Error("Không nhận được thông tin tài khoản.");
      }

      // OWNER / ADMIN / EDITOR
      if (
        data.user.role === "OWNER" ||
        data.user.role === "ADMIN" ||
        data.user.role === "EDITOR"
      ) {
        router.push("/admin");
        return;
      }

      // READER
      router.push("/");

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập không thành công."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <div className="flex min-h-screen items-center justify-center px-6">

        <div className="w-full max-w-md">

          {/* LOGO / TITLE */}

          <div className="mb-8 text-center">

            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Đăng nhập
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Đăng nhập vào tài khoản của bạn.
            </p>

          </div>

          {/* FORM */}

          <section className="rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6">

            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-900 bg-red-950/20 p-4">

                <p className="text-sm font-bold text-red-400">
                  ❌ {error}
                </p>

              </div>
            )}

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="example@gmail.com"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

            </div>

            {/* PASSWORD */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-bold text-gray-300">
                Mật khẩu
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

            </div>

            {/* BUTTON */}

            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "⏳ Đang đăng nhập..."
                : "Đăng nhập"}
            </button>

          </section>

        </div>

      </div>

    </main>
  );
}