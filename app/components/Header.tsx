"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LoginModal from "./LoginModal";
import UserMenu from "./UserMenu";

type User = {
  id: string;
  username: string;
  email?: string;
  role: string;
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);

  const [loadingUser, setLoadingUser] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  async function loadUser() {
    try {
      setLoadingUser(true);

      const response = await fetch(
        "/api/user/profile",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setUser(null);
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error(
        "HEADER LOAD USER ERROR:",
        error
      );

      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 font-bold text-white">
              Y
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-bold text-purple-600">
                Yoru Translation
              </p>

              <p className="text-xs text-gray-400">
                Team
              </p>

            </div>

          </Link>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-6 md:flex">

            <Link
              href="/"
              className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
            >
              Trang chủ
            </Link>

            <Link
              href="/manga"
              className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
            >
              Manga
            </Link>

            <Link
              href="/manhwa"
              className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
            >
              Manhwa
            </Link>

            <Link
              href="/manhua"
              className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
            >
              Manhua
            </Link>

            <Link
              href="/completed"
              className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
            >
              Hoàn thành
            </Link>

          </nav>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-3">

            {/* SEARCH */}

            <Link
              href="/search"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-purple-50"
              aria-label="Tìm kiếm"
            >
              🔍
            </Link>

            {/* USER */}

            {!loadingUser && user ? (
              <UserMenu
                user={user}
                onLogout={() => {
                  /*
                   * Tạm thời sẽ xử lý logout
                   * sau khi kiểm tra session.ts
                   */
                  console.log("LOGOUT CLICK");
                }}
              />
            ) : !loadingUser ? (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                Đăng nhập
              </button>
            ) : (
              <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-100" />
            )}

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg md:hidden"
            >
              ☰
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">

            <div className="flex flex-col gap-1">

              <Link
                href="/"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-purple-50"
              >
                Trang chủ
              </Link>

              <Link
                href="/manga"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-purple-50"
              >
                Manga
              </Link>

              <Link
                href="/manhwa"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-purple-50"
              >
                Manhwa
              </Link>

              <Link
                href="/manhua"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-purple-50"
              >
                Manhua
              </Link>

              <Link
                href="/completed"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-purple-50"
              >
                Hoàn thành
              </Link>

            </div>

          </div>
        )}

      </header>

      {/* LOGIN MODAL */}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={() => {
          void loadUser();
        }}
      />
    </>
  );
}