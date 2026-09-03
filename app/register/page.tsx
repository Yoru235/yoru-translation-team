"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (
        !username.trim() ||
        !email.trim() ||
        !password ||
        !confirmPassword
      ) {
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Mật khẩu nhập lại không khớp.");
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data =
        (await response.json()) as RegisterResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tạo tài khoản."
        );
      }

      setSuccess(
        data.message || "Tạo tài khoản thành công."
      );

      // Chuyển sang đăng nhập sau một chút
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo tài khoản."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <div className="flex min-h-screen items-center justify-center px-6 py-10">

        <div className="w-full max-w-md">

          {/* TIÊU ĐỀ */}

          <div className="mb-8 text-center">

            <p className="text-sm font-semibold text-purple-400">
              Yoru Translation Group
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Tạo tài khoản
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Đăng ký tài khoản để sử dụng đầy đủ
              tính năng của website.
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

            {/* SUCCESS */}

            {success && (
              <div className="mb-5 rounded-xl border border-green-900 bg-green-950/20 p-4">
                <p className="text-sm font-bold text-green-400">
                  ✓ {success}
                </p>

                <p className="mt-1 text-xs text-green-300">
                  Đang chuyển sang trang đăng nhập...
                </p>
              </div>
            )}

            {/* USERNAME */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-300">
                Tên người dùng
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Nhập tên người dùng"
                autoComplete="username"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

            </div>

            {/* EMAIL */}

            <div className="mt-5">

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
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-bold text-gray-300">
                Nhập lại mật khẩu
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleRegister();
                  }
                }}
                className="w-full rounded-xl border border-gray-700 bg-[#151515] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
              />

            </div>

            {/* BUTTON */}

            <button
              type="button"
              onClick={() => void handleRegister()}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "⏳ Đang tạo tài khoản..."
                : "Tạo tài khoản"}
            </button>

            {/* LOGIN LINK */}

            <div className="mt-6 text-center">

              <span className="text-sm text-gray-500">
                Đã có tài khoản?{" "}
              </span>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm font-bold text-purple-400 transition hover:text-pink-400"
              >
                Đăng nhập
              </button>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}