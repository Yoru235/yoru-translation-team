"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type AuthFormProps = {
  isModal?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
};

type ForgotPasswordStep = "email" | "otp" | "new_password";

export default function AuthForm({
  isModal = false,
  onSuccess,
  onClose,
}: AuthFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "forgot-password">("login");
  const [fpStep, setFpStep] = useState<ForgotPasswordStep>("email");

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password states
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const switchMode = (newMode: "login" | "forgot-password") => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
    if (newMode === "forgot-password") {
      setFpStep("email");
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  /* =========================================================
     1. XỬ LÝ ĐĂNG NHẬP
  ========================================================= */
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");

      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
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
          email: cleanEmail,
          password,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        user?: { id: string; username: string; role: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Đăng nhập không thành công.");
      }

      if (!data.user) {
        throw new Error("Không nhận được thông tin tài khoản.");
      }

      if (onClose) {
        onClose();
      }

      if (onSuccess) {
        onSuccess();
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
      if (!isModal) {
        router.push("/");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Đăng nhập không thành công."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     2. GỬI MÃ OTP
  ========================================================= */
  const handleSendOtp = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");

      const cleanEmail = email.trim();
      if (!cleanEmail) {
        setError("Vui lòng nhập email tài khoản.");
        return;
      }

      const response = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể gửi mã OTP.");
      }

      setSuccessMsg(`Mã xác nhận đã được gửi đến ${cleanEmail}.`);
      setFpStep("otp");
      setResendCooldown(60);
    } catch (err) {
      console.error("SEND OTP ERROR:", err);
      setError(err instanceof Error ? err.message : "Không thể gửi mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     3. XÁC THỰC OTP
  ========================================================= */
  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");

      const cleanEmail = email.trim();
      const cleanOtp = otp.trim();

      if (!cleanOtp) {
        setError("Vui lòng nhập mã xác nhận 6 số.");
        return;
      }

      const response = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        resetToken?: string;
      };

      if (!response.ok || !data.success || !data.resetToken) {
        throw new Error(data.error || "Mã xác nhận không chính xác.");
      }

      setResetToken(data.resetToken);
      setSuccessMsg("Xác nhận thành công! Vui lòng nhập mật khẩu mới.");
      setFpStep("new_password");
    } catch (err) {
      console.error("VERIFY OTP ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Mã xác nhận không chính xác."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     4. ĐỔI MẬT KHẨU MỚI
  ========================================================= */
  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");

      if (!newPassword || !confirmPassword) {
        setError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");
        return;
      }

      if (newPassword.length < 6) {
        setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Mật khẩu nhập lại không khớp.");
        return;
      }

      const cleanEmail = email.trim();
      const response = await fetch("/api/auth/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể đặt lại mật khẩu.");
      }

      // Đổi thành công -> Chuyển về login
      setMode("login");
      setPassword("");
      setSuccessMsg("Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Không thể đặt lại mật khẩu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = !isModal;

  return (
    <div className="w-full">
      {/* LOGO / TITLE */}
      <div className={isDark ? "mb-8 text-center" : "mb-7 pr-8"}>
        <p
          className={`text-sm font-semibold ${isDark ? "text-purple-400" : "text-purple-600"
            }`}
        >
          {isDark ? "Yoru Translation Group" : "Yoru Translation Team"}
        </p>

        <h1
          className={`mt-2 text-3xl ${isDark ? "font-extrabold text-white" : "font-bold text-gray-900"
            }`}
        >
          {mode === "login" && "Đăng nhập"}
          {mode === "forgot-password" && fpStep === "email" && "Quên mật khẩu"}
          {mode === "forgot-password" && fpStep === "otp" && "Mã xác nhận"}
          {mode === "forgot-password" &&
            fpStep === "new_password" &&
            "Mật khẩu mới"}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {mode === "login" &&
            (isDark
              ? "Đăng nhập vào tài khoản của bạn."
              : "Đăng nhập để sử dụng đầy đủ tính năng tài khoản.")}
          {mode === "forgot-password" &&
            fpStep === "email" &&
            "Nhập email để nhận mã xác nhận đặt lại mật khẩu."}
          {mode === "forgot-password" &&
            fpStep === "otp" &&
            `Mã xác nhận đã gửi đến ${email}.`}
          {mode === "forgot-password" &&
            fpStep === "new_password" &&
            "Nhập mật khẩu mới cho tài khoản của bạn."}
        </p>
      </div>

      {/* CARD BODY */}
      <div
        className={
          isDark
            ? "rounded-3xl border border-purple-900 bg-[#0b0b0b] p-6"
            : ""
        }
      >
        {/* ERROR */}
        {error && (
          <div
            className={`mb-5 rounded-xl border ${isDark
                ? "border-red-900 bg-red-950/20 p-4"
                : "border-red-200 bg-red-50 px-4 py-3"
              }`}
          >
            <p
              className={`text-sm font-bold ${isDark ? "text-red-400" : "font-medium text-red-600"
                }`}
            >
              ❌ {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {successMsg && (
          <div
            className={`mb-5 rounded-xl border ${isDark
                ? "border-emerald-900 bg-emerald-950/20 p-4"
                : "border-emerald-200 bg-emerald-50 px-4 py-3"
              }`}
          >
            <p
              className={`text-sm font-bold ${isDark ? "text-emerald-400" : "font-medium text-emerald-700"
                }`}
            >
              ✅ {successMsg}
            </p>
          </div>
        )}

        {/* =========================================================
            1. FORM ĐĂNG NHẬP
        ========================================================= */}
        {mode === "login" && (
          <div>
            {/* EMAIL */}
            <div>
              <label
                className={`mb-2 block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                  }`}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={isDark ? "example@gmail.com" : "Nhập email"}
                autoComplete="email"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark
                    ? "border-gray-700 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-600"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
                  }`}
              />
            </div>

            {/* PASSWORD */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  className={`block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                    }`}
                >
                  Mật khẩu
                </label>

                {/* QUÊN MẬT KHẨU */}
                <button
                  type="button"
                  onClick={() => switchMode("forgot-password")}
                  className={`text-xs font-bold transition ${isDark
                      ? "text-purple-400 hover:text-pink-400"
                      : "text-purple-600 hover:underline"
                    }`}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark
                    ? "border-gray-700 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-600"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
                  }`}
              />
            </div>

            {/* BUTTON */}
            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={isLoading}
              className={`mt-6 w-full rounded-xl bg-gradient-to-r ${isDark
                  ? "from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  : "from-purple-600 to-pink-500 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                }`}
            >
              {isLoading
                ? "Đang đăng nhập..."
                : isDark
                  ? "Đăng nhập"
                  : "ĐĂNG NHẬP"}
            </button>

            {/* ĐĂNG KÝ */}
            <div className="mt-5 text-center text-sm">
              <span className="text-gray-500">Chưa có tài khoản? </span>

              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  router.push("/register");
                }}
                className={`font-bold transition ${isDark
                    ? "text-purple-400 hover:text-pink-400"
                    : "text-purple-600 hover:underline"
                  }`}
              >
                {isDark ? "Đăng ký" : "Tạo tài khoản mới"}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            2. FORM QUÊN MẬT KHẨU - BƯỚC 1: NHẬP EMAIL
        ========================================================= */}
        {mode === "forgot-password" && fpStep === "email" && (
          <div>
            <div>
              <label
                className={`mb-2 block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                  }`}
              >
                Nhập Gmail tài khoản
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                autoComplete="email"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSendOtp();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark
                    ? "border-gray-700 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-600"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
                  }`}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleSendOtp()}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Đang gửi mã..." : "Gửi mã xác nhận (OTP)"}
            </button>

            <div className="mt-5 text-center text-sm">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`font-bold transition ${isDark
                    ? "text-purple-400 hover:text-pink-400"
                    : "text-purple-600 hover:underline"
                  }`}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            3. FORM QUÊN MẬT KHẨU - BƯỚC 2: NHẬP MÃ OTP
        ========================================================= */}
        {mode === "forgot-password" && fpStep === "otp" && (
          <div>
            <div>
              <label
                className={`mb-2 block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                  }`}
              >
                Mã xác nhận (OTP 6 số từ Gmail)
              </label>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, ""))
                }
                placeholder="123456"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleVerifyOtp();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 text-center text-xl font-bold tracking-[8px] outline-none transition ${isDark
                    ? "border-purple-800 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-500"
                    : "border-purple-300 bg-purple-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white"
                  }`}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Không thấy email? (Kiểm tra Spam)</span>
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={resendCooldown > 0 || isLoading}
                className={`font-bold transition ${isDark ? "text-purple-400" : "text-purple-600"
                  } disabled:cursor-not-allowed disabled:text-gray-600`}
              >
                {resendCooldown > 0
                  ? `Gửi lại sau (${resendCooldown}s)`
                  : "Gửi lại mã"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleVerifyOtp()}
              disabled={isLoading || otp.length < 6}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Đang xác thực..." : "Xác nhận mã OTP"}
            </button>

            <div className="mt-5 text-center text-sm">
              <button
                type="button"
                onClick={() => setFpStep("email")}
                className={`font-bold transition ${isDark
                    ? "text-purple-400 hover:text-pink-400"
                    : "text-purple-600 hover:underline"
                  }`}
              >
                ← Nhập email khác
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            4. FORM QUÊN MẬT KHẨU - BƯỚC 3: MẬT KHẨU MỚI & XÁC NHẬN
        ========================================================= */}
        {mode === "forgot-password" && fpStep === "new_password" && (
          <div>
            {/* MẬT KHẨU MỚI */}
            <div>
              <label
                className={`mb-2 block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                  }`}
              >
                Mật khẩu mới
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleResetPassword();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark
                    ? "border-gray-700 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-600"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
                  }`}
              />
            </div>

            {/* XÁC NHẬN MẬT KHẨU MỚI */}
            <div className="mt-5">
              <label
                className={`mb-2 block text-sm font-bold ${isDark ? "text-gray-300" : "font-semibold text-gray-700"
                  }`}
              >
                Xác nhận mật khẩu mới
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleResetPassword();
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark
                    ? "border-gray-700 bg-[#151515] text-white placeholder:text-gray-600 focus:border-purple-600"
                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white"
                  }`}
              />
            </div>

            {/* BUTTON THAY ĐỔI */}
            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Đang lưu thay đổi..." : "Thay đổi mật khẩu"}
            </button>

            <div className="mt-5 text-center text-sm">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`font-bold transition ${isDark
                    ? "text-purple-400 hover:text-pink-400"
                    : "text-purple-600 hover:underline"
                  }`}
              >
                ← Hủy & Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
