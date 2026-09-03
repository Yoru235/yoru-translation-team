"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  level: number;
  points: number;
  isActive: boolean;
  createdAt: string;
};

/* =========================================================
   ICONS
========================================================= */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.2-5.2 7-5.2s6.2 1.8 7 5.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9.5c.5-1 1.4-1.5 2.6-1.5 1.4 0 2.4.7 2.4 1.8 0 1.2-1 1.7-2.5 2.1-1.5.4-2.4.9-2.4 2.1 0 1.1 1 1.9 2.5 1.9 1.2 0 2.1-.5 2.6-1.5" />
      <path d="M12 6.8v10.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

/* =========================================================
   PROFILE PAGE
========================================================= */

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await fetch("/api/user/profile", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Không thể tải thông tin tài khoản."
        );
      }

      setUser(data.user);
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin tài khoản."
      );
    } finally {
      setLoading(false);
    }
  }
  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn một file ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ảnh avatar không được vượt quá 5MB.");
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage("");

      const formData = new FormData();
formData.append("file", file);
formData.append("type", "avatar");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message || "Không thể upload ảnh."
        );
      }

      const imageUrl =
        uploadData.imageUrl ||
        uploadData.images?.[0]?.imageUrl;

      if (!imageUrl) {
        throw new Error(
          "Không tìm thấy đường dẫn ảnh sau khi upload."
        );
      }

      const avatarResponse = await fetch(
        "/api/user/avatar",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            avatar: imageUrl,
          }),
        }
      );

      const avatarData = await avatarResponse.json();

      if (!avatarResponse.ok || !avatarData.success) {
        throw new Error(
          avatarData.message || "Không thể lưu avatar."
        );
      }

      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          avatar: avatarData.user.avatar,
        };
      });

      setMessage("Đổi avatar thành công!");
    } catch (error) {
      console.error("CHANGE AVATAR ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể đổi avatar."
      );
    } finally {
      setUploadingAvatar(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  async function handleCheckIn() {
    try {
      setCheckingIn(true);
      setMessage("");

      const response = await fetch("/api/user/check-in", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Điểm danh thất bại."
        );
      }

      setMessage(
        data.message || "Điểm danh thành công!"
      );

      await loadProfile();
    } catch (error) {
      console.error("CHECK IN ERROR:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Điểm danh thất bại."
      );
    } finally {
      setCheckingIn(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7fc]">
        <header className="border-b border-purple-100 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold text-purple-700"
            >
              <HomeIcon />
              Trang chủ
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-3xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />

            <p className="mt-5 font-semibold text-purple-600">
              Đang tải thông tin tài khoản...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!user) {
    return (
      <main className="min-h-screen bg-[#faf7fc]">
        <header className="border-b border-purple-100 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold text-purple-700"
            >
              <HomeIcon />
              Trang chủ
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Không thể tải hồ sơ
            </h1>

            <p className="mt-3 text-red-500">
              {message || "Đã xảy ra lỗi."}
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 font-bold text-white transition hover:bg-purple-800"
            >
              <HomeIcon />
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf7ff] via-[#fff8fc] to-[#f8f0ff]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">

          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-bold text-purple-700 transition hover:text-pink-600"
          >
            <HomeIcon />
            Trang chủ
          </Link>

          <Link
            href="/bookmark"
            className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100"
          >
            <BookmarkIcon />
            Bookmark
          </Link>

        </div>
      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* TIÊU ĐỀ */}

        <section className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-500">
            Tài khoản
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-purple-950 sm:text-4xl">
            Hồ sơ cá nhân
          </h1>

          <p className="mt-2 text-gray-500">
            Quản lý thông tin và hoạt động tài khoản của bạn.
          </p>
        </section>

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">

          {/* TOP DECORATION */}

          <div className="h-28 bg-gradient-to-r from-[#4b176d] via-[#8e278f] to-[#d13b91]" />

          {/* USER */}

          <div className="px-6 pb-7 sm:px-8">

            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">

              {/* AVATAR */}

<div className="flex shrink-0 flex-col items-center gap-3">
  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg">
    {user.avatar ? (
      <img
        src={user.avatar}
        alt={`Avatar của ${user.username}`}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="relative h-24 w-24 shrink-0">
  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg">
    {user.avatar ? (
      <img
        src={user.avatar}
        alt={user.username}
        className="h-full w-full object-cover"
      />
    ) : (
      <UserIcon />
    )}
  </div>

  <label
    htmlFor="avatar-upload"
    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-purple-700 text-white shadow-md transition hover:bg-pink-500"
    title="Đổi avatar"
  >
    ✎
  </label>

  <input
    id="avatar-upload"
    type="file"
    accept="image/png,image/jpeg,image/webp"
    className="hidden"
    onChange={handleAvatarChange}
    disabled={uploadingAvatar}
  />
</div>
    )}
  </div>

  <input
    ref={avatarInputRef}
    type="file"
    accept="image/*"
    onChange={handleAvatarChange}
    className="hidden"
  />

  <button
    type="button"
    onClick={() => avatarInputRef.current?.click()}
    disabled={uploadingAvatar}
    className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {uploadingAvatar ? "Đang tải..." : "Đổi avatar"}
  </button>
</div>

{/* USER INFO */}

<div className="min-w-0 flex-1 pb-1"></div>

              {/* USER INFO */}

              <div className="min-w-0 flex-1 pb-1">

                <h2 className="truncate text-2xl font-extrabold text-purple-950">
                  {user.username}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">

                  <span className="flex items-center gap-2">
                    <MailIcon />
                    {user.email}
                  </span>

                  <span className="flex items-center gap-2">
                    <ShieldIcon />
                    {user.role}
                  </span>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}
<section className="mt-6 grid gap-6 md:grid-cols-2">

  {/* LEVEL */}
  <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
    <p className="text-sm font-semibold text-purple-500">
      Cấp độ
    </p>

    <div className="mt-2">
      <span className="text-4xl font-extrabold text-purple-800">
        Lv.{user.level}
      </span>
    </div>

    <p className="mt-3 text-sm leading-6 text-gray-500">
      Level càng cao, bạn càng có thể mở khóa
      nhiều nội dung hơn.
    </p>
  </div>

  {/* ĐIỂM */}
  <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
    <p className="text-sm font-semibold text-pink-500">
      Điểm
    </p>

    <div className="mt-2">
      <span className="text-4xl font-extrabold text-pink-600">
        {user.points}
      </span>
    </div>

    <p className="mt-3 text-sm leading-6 text-gray-500">
      Điểm nhận được từ các hoạt động trên website.
    </p>
  </div>

</section>

        {/* =================================================
            CHECK IN
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">

          <div className="p-6 sm:p-7">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <CalendarIcon />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-purple-950">
                    Điểm danh hằng ngày
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Điểm danh để nhận điểm và tăng level.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingIn ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang điểm danh...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Điểm danh
                  </>
                )}
              </button>

            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700">
                {message}
              </div>
            )}

          </div>
        </section>

        {/* =================================================
            ACCOUNT STATUS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-600">
              <ShieldIcon />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-purple-950">
                Trạng thái tài khoản
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Thông tin hiện tại của tài khoản.
              </p>
            </div>

          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">

            <div className="flex items-center gap-3">

              <span
                className={`h-3 w-3 rounded-full ${
                  user.isActive
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <span className="font-semibold text-gray-700">
                {user.isActive
                  ? "Tài khoản đang hoạt động"
                  : "Tài khoản đã bị khóa"}
              </span>

            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                user.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {user.isActive ? "ACTIVE" : "LOCKED"}
            </span>

          </div>

        </section>

        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2">

          <Link
            href="/bookmark"
            className="group flex items-center justify-between rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BookmarkIcon />
              </div>

              <div>
                <p className="font-bold text-purple-950">
                  Truyện đã lưu
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Xem danh sách bookmark
                </p>
              </div>

            </div>

            <span className="text-lg text-purple-400 transition group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href="/"
            className="group flex items-center justify-between rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                <HomeIcon />
              </div>

              <div>
                <p className="font-bold text-purple-950">
                  Khám phá truyện
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Quay lại trang chủ
                </p>
              </div>

            </div>

            <span className="text-lg text-pink-400 transition group-hover:translate-x-1">
              →
            </span>
          </Link>

        </section>

      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mt-10 border-t border-purple-100 bg-white px-6 py-8 text-center">

        <p className="font-bold text-purple-800">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-xs text-gray-400">
          © 2026 Yoru Translation Group
        </p>

      </footer>

    </main>
  );
}