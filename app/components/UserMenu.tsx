"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type User = {
  id: string;
  username: string;
  email?: string;
  role: string;
};

type UserMenuProps = {
  user: User;
  onLogout?: () => void;
};

export default function UserMenu({
  user,
  onLogout,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const firstLetter =
    user.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      ref={menuRef}
      className="relative"
    >

      {/* AVATAR */}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full transition hover:opacity-80"
      >

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
          {firstLetter}
        </div>

        <div className="hidden text-left sm:block">

          <p className="max-w-[120px] truncate text-sm font-bold text-gray-900">
            {user.username}
          </p>

          <p className="text-xs text-gray-500">
            Thành viên
          </p>

        </div>

        <span className="text-gray-400">
          {open ? "▲" : "▼"}
        </span>

      </button>

      {/* DROPDOWN */}

      {open && (
        <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

          {/* USER INFO */}

          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">

            <p className="font-bold text-gray-900">
              {user.username}
            </p>

            {user.email && (
              <p className="mt-1 truncate text-xs text-gray-500">
                {user.email}
              </p>
            )}

          </div>

          {/* HỒ SƠ */}

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-gray-700 transition hover:bg-purple-50"
          >
            👤 Hồ sơ cá nhân
          </Link>

          {/* BOOKMARK */}

          <Link
            href="/bookmark"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-gray-700 transition hover:bg-purple-50"
          >
            🔖 Bookmark
          </Link>

          {/* LỊCH SỬ */}

          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-gray-700 transition hover:bg-purple-50"
          >
             Lịch sử đọc
          </Link>


          <div className="my-1 border-t border-gray-100" />

          {/* LOGOUT */}

          <button
            type="button"
            onClick={() => {
              setOpen(false);

              if (onLogout) {
                onLogout();
              }
            }}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            🚪 Đăng xuất
          </button>

        </div>
      )}

    </div>
  );
}