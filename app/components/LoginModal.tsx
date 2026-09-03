"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
};

type LoginResponse = {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
};

export default function LoginModal({
  open,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");

      if (!email.trim() || !password) {
        setError("Vui lòng nhập email và mật khẩu.");
        return;
      }

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
        throw new Error(
          "Không nhận được thông tin tài khoản."
        );
      }

      /*
       * ADMIN / OWNER / EDITOR
       * vẫn đưa vào trang quản trị
       */
      if (
        data.user.role === "OWNER" ||
        data.user.role === "ADMIN" ||
        data.user.role === "EDITOR"
      ) {
        onClose();

        router.push("/admin");

        return;
      }

      /*
       * READER
       */
      onClose();

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      /*
       * Reload để Header lấy lại thông tin user
       */
      router.refresh();

    } catch (err) {
      console.error("LOGIN MODAL ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Đăng nhập không thành công."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >

        {/* NÚT ĐÓNG */}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-2xl text-gray-400 transition hover:text-gray-700"
        >
          ×
        </button>

        {/* TIÊU ĐỀ */}

        <div className="mb-7 pr-8">

          <p className="text-sm font-semibold text-purple-600">
            Yoru Translation Team
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Đăng nhập
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Đăng nhập để sử dụng đầy đủ tính năng tài khoản.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* EMAIL */}

        <div>

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleLogin();
              }
            }}
            placeholder="Nhập email"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
          />

        </div>

        {/* PASSWORD */}

        <div className="mt-5">

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Mật khẩu
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleLogin();
              }
            }}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
          />

        </div>

        {/* BUTTON */}

        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Đang đăng nhập..."
            : "ĐĂNG NHẬP"}
        </button>

        {/* ĐĂNG KÝ */}

        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/register");
          }}
          className="mt-5 w-full text-center text-sm font-semibold text-purple-600 hover:underline"
        >
          Tạo tài khoản mới
        </button>

      </div>
    </div>
  );
}