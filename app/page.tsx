"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MangaCard from "./components/MangaCard";
import MangaSection from "./components/MangaSection";

type Manga = {
  id: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
 translationGroup:
  | string
  | {
      id: string;
      name: string;
      slug: string;
      avatar: string | null;
    }
  | null;
  type: string;
  status: string;
  ageRestricted: boolean;
  coverUrl: string | null;
  creditUrl: string | null;
  genres: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
};
type TranslationGroup = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  _count: {
    mangas: number;
  };
};
type MangaApiResponse = {
  success: boolean;
  mangas?: Manga[];
  error?: string;
};
export default function Home() {
  const router = useRouter();
  const handleLogout = async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Không thể đăng xuất."
      );
    }

    // Xóa trạng thái đăng nhập trên giao diện
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowUserMenu(false);

    // Làm mới trang để kiểm tra session lại
    router.refresh();
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Không thể đăng xuất."
    );
  }
};
  const [showLogin, setShowLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
const [activeFilter, setActiveFilter] = useState("all");
const [mangaList, setMangaList] = useState<Manga[]>([]);
const [translationGroups, setTranslationGroups] = useState<
  TranslationGroup[]
>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Đăng nhập
const [showUserMenu, setShowUserMenu] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [currentUser, setCurrentUser] = useState<{
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
} | null>(null);

// Form đăng nhập
const [loginUsername, setLoginUsername] = useState("");
const [loginPassword, setLoginPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [featuredIndex, setFeaturedIndex] = useState(0);
const [isFeaturedPaused, setIsFeaturedPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMangas = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/mangas", {
          method: "GET",
          cache: "no-store",
        });

        const data =
          (await response.json()) as MangaApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Không thể tải danh sách truyện."
          );
        }

        if (!cancelled) {
          setMangaList(
            Array.isArray(data.mangas)
              ? data.mangas
              : []
          );
        }
      } catch (error) {
        console.error(
          "LOAD MANGA ERROR:",
          error
        );

        if (!cancelled) {
          setMangaList([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadMangas();

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
  const checkLogin = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
  setIsLoggedIn(true);
  setCurrentUser(data.user);
} else {
  setIsLoggedIn(false);
  setCurrentUser(null);
}
    } catch (error) {
      console.error("CHECK LOGIN ERROR:", error);
      setIsLoggedIn(false);
    }
  };

  void checkLogin();
}, []);
useEffect(() => {
  const loadTranslationGroups = async () => {
    try {
      const response = await fetch(
        "/api/translation-groups",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.groups)) {
        setTranslationGroups(data.groups);
      }
    } catch (error) {
      console.error(
        "Lỗi tải nhóm dịch:",
        error,
      );
    }
  };

  void loadTranslationGroups();
}, []);
const filteredManga = mangaList.filter((manga) => {
  const keyword = search.trim().toLowerCase();

  // Lọc theo ô tìm kiếm
  const matchesSearch =
    keyword === "" ||
    manga.title.toLowerCase().includes(keyword);

  // Lọc theo menu
  const matchesFilter =
    activeFilter === "all" ||
    (activeFilter === "manga" &&
      manga.type.toLowerCase() === "manga") ||
    (activeFilter === "manhwa" &&
      manga.type.toLowerCase() === "manhwa") ||
    (activeFilter === "manhua" &&
      manga.type.toLowerCase() === "manhua") ||
    (activeFilter === "ongoing" &&
      manga.status.toLowerCase() === "ongoing") ||
    (activeFilter === "completed" &&
      manga.status.toLowerCase() === "completed") ||
    (activeFilter === "group" &&
      Boolean(manga.translationGroup));

  return matchesSearch && matchesFilter;
});
  const hotManga = [...mangaList]
  .sort((a, b) => b.views - a.views)
  .slice(0, 6);

const newManga = [...mangaList]
  .sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  )
  .slice(0, 6);

const completedManga = mangaList
  .filter((manga) => manga.status === "completed")
  .slice(0, 6);

const mangaOnly = mangaList
  .filter((manga) => manga.type.toLowerCase() === "manga")
  .slice(0, 6);

const manhwaOnly = mangaList
  .filter((manga) => manga.type.toLowerCase() === "manhwa")
  .slice(0, 6);

const manhuaOnly = mangaList
  .filter((manga) => manga.type.toLowerCase() === "manhua")
  .slice(0, 6);
  const bannerManga = mangaList.slice(0, 7);

useEffect(() => {
  if (bannerManga.length <= 1 || isFeaturedPaused) return;

  const timer = setInterval(() => {
    setFeaturedIndex((current) => {
      if (bannerManga.length === 0) return 0;
      return (current + 1) % bannerManga.length;
    });
  }, 5000);

  return () => clearInterval(timer);
}, [bannerManga.length, isFeaturedPaused]);

useEffect(() => {
  if (
    bannerManga.length > 0 &&
    featuredIndex >= bannerManga.length
  ) {
    setFeaturedIndex(0);
  }
}, [bannerManga.length, featuredIndex]);

const getBannerIndex = (offset: number) => {
  if (bannerManga.length === 0) return 0;

  return (
    (featuredIndex + offset + bannerManga.length) %
    bannerManga.length
  );
};
  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!loginUsername.trim() || !loginPassword.trim()) {
    alert("Vui lòng nhập đầy đủ thông tin.");
    return;
  }

  // TẠM THỜI chỉ mô phỏng đăng nhập
  // Sau này sẽ thay bằng API đăng nhập thật.
  setIsLoggedIn(true);
  setShowLogin(false);

  setLoginUsername("");
  setLoginPassword("");
};

  return (
    <main
      className={`min-h-screen font-sans ${
        darkMode
          ? "bg-gradient-to-b from-[#12091a] via-[#1d0d27] to-[#28102a] text-white"
          : "bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] text-purple-950"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#4b176d] via-[#8e278f] to-[#d13b91] shadow-lg">
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-4 px-6">

          {/* LOGO + TÊN NHÓM */}

          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-12 w-auto object-contain"
            />

            <span className="text-xl font-extrabold text-white">
              Yoru Translation Group
            </span>
          </div>

          {/* TÌM KIẾM + DARK MODE + ĐĂNG NHẬP */}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Tìm truyện..."
              className="w-32 rounded-xl border border-white/30 bg-white px-4 py-2 text-sm text-purple-950 outline-none placeholder:text-purple-400 focus:ring-2 focus:ring-pink-300 sm:w-52"
            />

            <button
              type="button"
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="rounded-xl bg-white/20 px-3 py-2 text-lg text-white backdrop-blur transition hover:bg-white/30"
              title="Đổi giao diện"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* ĐĂNG NHẬP */}

            {!isLoggedIn ? (
  <button
    type="button"
    onClick={() => router.push("/login")}
    className="rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-purple-700 shadow-md transition hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-lg"
  >
    Đăng nhập
  </button>
) : (
  <div className="relative">
    <button
      type="button"
      onClick={() =>
        setShowUserMenu((value) => !value)
      }
      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md transition hover:bg-purple-50"
    >
      {/* AVATAR */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 text-sm font-extrabold text-white">
  {currentUser?.avatar ? (
    <img
      src={currentUser.avatar}
      alt={currentUser.username}
      className="h-full w-full object-cover"
    />
  ) : (
    currentUser?.username
      ?.charAt(0)
      .toUpperCase() || "Y"
  )}
</div>

      {/* USERNAME */}
      <span className="hidden max-w-[120px] truncate text-sm font-extrabold text-purple-800 sm:block">
        {currentUser?.username || "Tài khoản"}
      </span>

      {/* MŨI TÊN */}
      <span
        className={`text-xs text-purple-500 transition-transform ${
          showUserMenu ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>

    {showUserMenu && (
      <div className="absolute right-0 top-14 z-[100] w-64 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl">

        {/* USER INFO */}
        <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-4">
          <p className="truncate text-base font-extrabold text-purple-900">
            {currentUser?.username || "Tài khoản"}
          </p>

          <p className="mt-1 truncate text-xs text-purple-500">
            {currentUser?.email || ""}
          </p>

          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-pink-500">
            {currentUser?.role || "READER"}
          </p>
        </div>

        {/* MENU */}
        <div className="p-2">

          <a
            href="/profile"
            className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-purple-800 transition hover:bg-purple-50"
          >
            Hồ sơ cá nhân
          </a>

          <a
            href="/bookmark"
            className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-purple-800 transition hover:bg-purple-50"
          >
            Truyện đã lưu
          </a>

          <a
  href="/history"
  className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-purple-800 transition hover:bg-purple-50"
>
   Lịch sử đọc
</a>

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch(
                  "/api/auth/logout",
                  {
                    method: "POST",
                  }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                  throw new Error(
                    data.error ||
                      "Không thể đăng xuất."
                  );
                }

                setIsLoggedIn(false);
                setCurrentUser(null);
                setShowUserMenu(false);

                router.refresh();
              } catch (error) {
                console.error(
                  "LOGOUT ERROR:",
                  error
                );

                alert(
                  error instanceof Error
                    ? error.message
                    : "Không thể đăng xuất."
                );
              }
            }}
            className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            Đăng xuất
          </button>

        </div>
      </div>
    )}
  </div>
)}
          </div>
        </div>
      </header>

      {/* =====================================================
          MENU
      ===================================================== */}

      <nav
  className={`shadow-md ${
    darkMode
      ? "bg-gradient-to-r from-[#35134a] via-[#55165e] to-[#711652]"
      : "bg-gradient-to-r from-[#551b78] via-[#8b258e] to-[#bd2688]"
  }`}
>
  <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-6 py-4">

    <button
      type="button"
      onClick={() => setActiveFilter("all")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "all"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Trang chủ
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("manga")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "manga"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Manga
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("manhwa")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "manhwa"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Manhwa
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("manhua")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "manhua"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Manhua
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("ongoing")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "ongoing"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Đang tiến hành
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("completed")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "completed"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Đã hoàn thành
    </button>

    <button
      type="button"
      onClick={() => setActiveFilter("group")}
      className={`whitespace-nowrap font-bold transition ${
        activeFilter === "group"
          ? "text-pink-200"
          : "text-white hover:text-pink-200"
      }`}
    >
      Nhóm dịch
    </button>

  </div>
</nav>

      {/* =====================================================
          BANNER
      ===================================================== */}

      <section className="mx-auto mt-7 max-w-7xl px-6">
  {bannerManga.length > 0 && (
    <div
      className="relative h-[360px] overflow-hidden rounded-3xl bg-gray-950 shadow-xl"
      onMouseEnter={() => setIsFeaturedPaused(true)}
      onMouseLeave={() => setIsFeaturedPaused(false)}
    >
      {/* DẢI BÌA */}
      <div className="absolute inset-0 flex items-center justify-center">
        {bannerManga.map((manga, index) => {
          const total = bannerManga.length;

          let offset = index - featuredIndex;

          if (offset > total / 2) {
            offset -= total;
          }

          if (offset < -total / 2) {
            offset += total;
          }

          const absOffset = Math.abs(offset);

          const isCenter = offset === 0;

          // Chỉ hiển thị tối đa 3 bìa mỗi bên
          const isVisible = absOffset <= 3;

          if (!isVisible) return null;

          return (
            <button
              key={manga.id}
              type="button"
              onClick={() => router.push(`/manga/${manga.id}`)}
              className="absolute left-1/2 top-1/2 origin-center transition-all duration-700 ease-in-out"
              style={{
                transform: `
                  translate(-50%, -50%)
                  translateX(${offset * 165}px)
                  scale(${isCenter ? 1.12 : absOffset === 1 ? 0.96 : 0.84})
                `,
                zIndex: 20 - absOffset,
                opacity: absOffset === 3 ? 0.45 : absOffset === 2 ? 0.7 : 1,
              }}
            >
              <div
                className={`relative h-[285px] w-[190px] overflow-hidden rounded-2xl bg-gray-800 shadow-2xl transition-all duration-700 ${
                  isCenter
                    ? "ring-4 ring-white/80 shadow-white/20"
                    : ""
                }`}
              >
                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-white">
                    {manga.title}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* NÚT TRÁI */}
      <button
        type="button"
        onClick={() => setFeaturedIndex(getBannerIndex(-1))}
        className="absolute left-5 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white backdrop-blur transition hover:bg-black/70"
        aria-label="Bìa trước"
      >
        ‹
      </button>

      {/* NÚT PHẢI */}
      <button
        type="button"
        onClick={() => setFeaturedIndex(getBannerIndex(1))}
        className="absolute right-5 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-3xl text-white backdrop-blur transition hover:bg-black/70"
        aria-label="Bìa tiếp theo"
      >
        ›
      </button>

      {/* CHẤM CHUYỂN BÌA */}
      <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-2">
        {bannerManga.map((manga, index) => (
          <button
            key={manga.id}
            type="button"
            onClick={() => setFeaturedIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === featuredIndex
                ? "w-7 bg-white"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Chuyển đến bìa ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )}
</section>

{activeFilter === "all" ? (
  <>
    <MangaSection
      title="Truyện Hot"
      mangas={hotManga}
    />

    <MangaSection
      title="Mới cập nhật"
      mangas={newManga}
    />

    <MangaSection
      title="Truyện hoàn thành"
      mangas={completedManga}
    />

    <MangaSection
      title="Manga"
      mangas={mangaOnly}
    />

    <MangaSection
      title="Manhwa"
      mangas={manhwaOnly}
    />

    <MangaSection
      title="Manhua"
      mangas={manhuaOnly}
    />
  </>
) : activeFilter === "group" ? (
  /* =====================================================
     DANH SÁCH NHÓM DỊCH
  ===================================================== */
  <section className="mx-auto mt-12 max-w-7xl px-6">
    <div className="mb-7">
      <h2
        className={
          darkMode
            ? "text-3xl font-extrabold text-pink-200"
            : "text-3xl font-extrabold text-purple-900"
        }
      >
        Nhóm dịch
      </h2>

      <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
    </div>

    {translationGroups.length === 0 ? (
      <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
        <p className="font-semibold text-purple-600">
          Chưa có nhóm dịch nào.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {translationGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() =>
              router.push(
                `/translation-group/${group.slug}`,
              )
            }
            className={
              darkMode
                ? "group rounded-2xl border border-purple-900 bg-[#24152f] p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                : "group rounded-2xl border border-purple-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            }
          >
            {/* AVATAR NHÓM */}
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-purple-100">
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-purple-600">
                  {group.name
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* TÊN NHÓM */}
            <h3
              className={
                darkMode
                  ? "mt-4 line-clamp-2 font-bold text-white group-hover:text-pink-300"
                  : "mt-4 line-clamp-2 font-bold text-gray-900 group-hover:text-purple-600"
              }
            >
              {group.name}
            </h3>

            {/* SỐ TRUYỆN */}
            <p
              className={
                darkMode
                  ? "mt-1 text-sm text-purple-300"
                  : "mt-1 text-sm text-gray-500"
              }
            >
              {group._count?.mangas ?? 0} truyện
            </p>
          </button>
        ))}
      </div>
    )}
  </section>
) : (
  /* =====================================================
     DANH SÁCH TRUYỆN THEO BỘ LỌC
  ===================================================== */
  <section className="mx-auto mt-12 max-w-7xl px-6">
    <div className="mb-7">
      <h2
        className={
          darkMode
            ? "text-3xl font-extrabold text-pink-200"
            : "text-3xl font-extrabold text-purple-900"
        }
      >
        {activeFilter === "manga" && "Manga"}
        {activeFilter === "manhwa" && "Manhwa"}
        {activeFilter === "manhua" && "Manhua"}
        {activeFilter === "ongoing" && "Đang tiến hành"}
        {activeFilter === "completed" && "Đã hoàn thành"}
      </h2>

      <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
    </div>

    {filteredManga.length === 0 ? (
      <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
        <p className="font-semibold text-purple-600">
          Chưa có truyện phù hợp.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {filteredManga.map((manga) => (
          <MangaCard
            key={manga.id}
            id={manga.id}
            title={manga.title}
            coverUrl={manga.coverUrl}
          />
        ))}
      </div>
    )}
  </section>
)}
      {/* =====================================================
          TRUYỆN NỔI BẬT
      ===================================================== */}

      <section
        id="manga"
        className="mx-auto mt-12 max-w-7xl px-6"
      >
        <div className="mb-7 flex items-end justify-between">

          <div>
            <h2
              className={
                darkMode
                  ? "text-4xl font-extrabold text-pink-200"
                  : "text-4xl font-extrabold text-[#75257f]"
              }
            >
              Truyện nổi bật
            </h2>

            <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          </div>

          <button
            type="button"
            className={
              darkMode
                ? "hidden rounded-xl border border-purple-700 bg-[#24152f] px-5 py-2 text-sm font-semibold text-pink-200 shadow-sm hover:bg-purple-900 sm:block"
                : "hidden rounded-xl border border-purple-200 bg-white px-5 py-2 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-50 sm:block"
            }
          >
            Xem tất cả →
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-purple-600">
              Đang tải truyện...
            </p>
          </div>
        ) : filteredManga.length === 0 ? (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-purple-600">
              Chưa có truyện nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {filteredManga
              .slice(0, 4)
              .map((manga) => (
                <a
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className={
                    darkMode
                      ? "group overflow-hidden rounded-2xl border border-purple-900 bg-[#24152f] shadow-lg transition duration-300 hover:-translate-y-2"
                      : "group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                  }
                >
                  <div className="overflow-hidden bg-purple-100">

                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-purple-100 text-purple-400">
                        Chưa có ảnh bìa
                      </div>
                    )}
                  </div>

                  <div className="p-4">

                    <h3
                      className={
                        darkMode
                          ? "text-lg font-extrabold text-white"
                          : "text-lg font-extrabold text-purple-900"
                      }
                    >
                      {manga.title}
                    </h3>

                    <p
                      className={
                        darkMode
                          ? "mt-1 text-sm text-purple-300"
                          : "mt-1 text-sm text-purple-500"
                      }
                    >
                      {manga.type}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-2">

                      <p className="text-sm font-semibold text-pink-500">
                        ❤️ 0 lượt xem
                      </p>

                      <span
                        className={
                          darkMode
                            ? "rounded-full bg-purple-900 px-3 py-1 text-xs font-medium text-pink-200"
                            : "rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600"
                        }
                      >
                        {manga.status}
                      </span>

                    </div>
                  </div>
                </a>
              ))}
          </div>
        )}
      </section>

      {/* =====================================================
          MỚI CẬP NHẬT
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div className="mb-7 flex items-center justify-between">

          <div>
            <h2
              className={
                darkMode
                  ? "text-3xl font-extrabold text-pink-200"
                  : "text-3xl font-extrabold text-purple-900"
              }
            >
              Mới cập nhật
            </h2>

            <div className="mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          </div>

          <button
            type="button"
            className={
              darkMode
                ? "rounded-xl bg-purple-900 px-4 py-2 text-sm font-semibold text-pink-200 hover:bg-purple-800"
                : "rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200"
            }
          >
            Xem thêm →
          </button>
        </div>

        <div className="grid gap-4">

          {filteredManga
            .slice(0, 3)
            .map((manga) => (
              <a
                key={`update-${manga.id}`}
                href={`/manga/${manga.id}`}
                className={
                  darkMode
                    ? "flex items-center gap-4 rounded-2xl border border-purple-900 bg-[#24152f] p-4 shadow"
                    : "flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm"
                }
              >
                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="h-24 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-20 items-center justify-center rounded-xl bg-purple-100 text-xs text-purple-400">
                    No cover
                  </div>
                )}

                <div className="flex-1">

                  <h3
                    className={
                      darkMode
                        ? "font-bold text-pink-200"
                        : "font-bold text-purple-800"
                    }
                  >
                    {manga.title}
                  </h3>

                  <p
                    className={
                      darkMode
                        ? "mt-1 text-sm text-purple-300"
                        : "mt-1 text-sm text-purple-500"
                    }
                  >
                    {manga.type}
                  </p>

                  <p className="mt-2 text-sm text-pink-500">
                    ❤️ 0 lượt xem
                  </p>
                </div>

                <span
                  className={
                    darkMode
                      ? "hidden rounded-full bg-purple-900 px-3 py-1 text-xs font-semibold text-pink-200 sm:block"
                      : "hidden rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 sm:block"
                  }
                >
                  {manga.status}
                </span>
              </a>
            ))}

        </div>
      </section>

      {/* =====================================================
          TRUYỆN HOT
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-fuchsia-700 to-pink-600 p-8 shadow-xl">

          <h2 className="text-3xl font-extrabold text-white">
            Truyện Hot
          </h2>

          <p className="mt-2 text-purple-100">
            Những bộ truyện đang được độc giả quan tâm.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">

            {filteredManga
              .slice(0, 4)
              .map((manga) => (
                <a
                  key={`hot-${manga.id}`}
                  href={`/manga/${manga.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-2"
                >
                  {manga.coverUrl ? (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="h-60 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-60 items-center justify-center bg-purple-100 text-purple-400">
                      Chưa có ảnh bìa
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="font-bold text-purple-900">
                      {manga.title}
                    </h3>

                    <p className="mt-2 text-sm text-pink-500">
                      ❤️ 0 lượt xem
                    </p>

                  </div>
                </a>
              ))}

          </div>
        </div>
      </section>

      {/* =====================================================
          THỂ LOẠI
      ===================================================== */}

      <section className="mx-auto mt-16 max-w-7xl px-6">

        <div
          className={
            darkMode
              ? "rounded-3xl border border-purple-900 bg-[#24152f] p-8"
              : "rounded-3xl border border-purple-100 bg-white/70 p-8"
          }
        >

          <h2
            className={
              darkMode
                ? "text-3xl font-extrabold text-pink-200"
                : "text-3xl font-extrabold text-purple-900"
            }
          >
            Khám phá theo thể loại
          </h2>

          <p
            className={
              darkMode
                ? "mt-2 text-purple-300"
                : "mt-2 text-purple-500"
            }
          >
            Tìm bộ truyện phù hợp với bạn.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              className="rounded-full bg-purple-100 px-5 py-2 font-semibold text-purple-700 hover:bg-purple-200"
            >
              Manga
            </button>

            <button
              type="button"
              className="rounded-full bg-fuchsia-100 px-5 py-2 font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
            >
              Manhwa
            </button>

            <button
              type="button"
              className="rounded-full bg-pink-100 px-5 py-2 font-semibold text-pink-700 hover:bg-pink-200"
            >
              Manhua
            </button>

            <button
              type="button"
              className="rounded-full bg-purple-100 px-5 py-2 font-semibold text-purple-700 hover:bg-purple-200"
            >
              Đã hoàn thành
            </button>

            <button
              type="button"
              className="rounded-full bg-fuchsia-100 px-5 py-2 font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
            >
              Đang tiến hành
            </button>

          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mt-20 bg-gradient-to-r from-[#4b176d] via-[#812681] to-[#c9328d] px-6 py-10 text-center text-white">

        <img
          src="/logo.png"
          alt="Yoru Translation Group"
          className="mx-auto mb-4 h-20 w-auto object-contain"
        />

        <h3 className="text-xl font-bold">
          Yoru Translation Group
        </h3>

        <p className="mt-2 text-sm text-purple-100">
          Manga · Manhwa · Manhua
        </p>

        <p className="mt-5 text-xs text-purple-200">
          © 2026 Yoru Translation Team. All rights reserved.
        </p>

        <p className="mt-2 text-sm text-purple-100">
          Fanpage:{" "}
          <a
            href="https://www.facebook.com/share/1BW7DS6RdZ/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline transition hover:text-white"
          >
            Yoru Translation Group
          </a>
        </p>

      </footer>
      {/* =====================================================
    LOGIN MODAL
===================================================== */}

{showLogin && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
    onClick={() => setShowLogin(false)}
  >

    <div
      className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >

      {/* Nút đóng */}

      <button
        type="button"
        onClick={() => setShowLogin(false)}
        className="absolute right-5 top-5 text-2xl text-gray-400 transition hover:text-purple-700"
      >
        ×
      </button>

      {/* Tiêu đề */}

      <div className="mb-7">

        <h2 className="text-3xl font-extrabold text-purple-900">
          Đăng nhập
        </h2>

        <p className="mt-2 text-sm text-purple-500">
          Đăng nhập để lưu truyện, bookmark và theo dõi lịch sử đọc.
        </p>

      </div>

      <form
        onSubmit={handleLogin}
        className="space-y-5"
      >

        {/* Username */}

        <div>

          <label className="mb-2 block text-sm font-bold text-purple-900">
            Tên người dùng hoặc địa chỉ email
          </label>

          <input
            type="text"
            value={loginUsername}
            onChange={(event) =>
              setLoginUsername(event.target.value)
            }
            placeholder="Tên đăng nhập hoặc địa chỉ email"
            className="w-full rounded-xl border border-purple-200 bg-purple-50/40 px-4 py-3 text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />

        </div>

        {/* Password */}

        <div>

          <label className="mb-2 block text-sm font-bold text-purple-900">
            Mật khẩu
          </label>

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              value={loginPassword}
              onChange={(event) =>
                setLoginPassword(event.target.value)
              }
              placeholder="Mật khẩu"
              className="w-full rounded-xl border border-purple-200 bg-purple-50/40 px-4 py-3 pr-12 text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-purple-400"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>

          </div>

        </div>

        {/* Remember */}

        <div className="flex items-center justify-between">

          <label className="flex items-center gap-2 text-sm text-purple-700">

            <input
              type="checkbox"
              className="h-4 w-4 rounded border-purple-300"
            />

            Ghi nhớ đăng nhập

          </label>

          <button
            type="button"
            className="text-sm font-semibold text-purple-600 hover:underline"
          >
            Quên mật khẩu?
          </button>

        </div>

        {/* Cloudflare - CHƯA BẬT */}

        <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-center text-xs text-purple-500">
          Khu vực xác minh chống bot sẽ được thêm bằng Cloudflare Turnstile.
        </div>

        {/* Login */}

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 py-3.5 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          ĐĂNG NHẬP
        </button>

        {/* Register */}

        <button
          type="button"
          className="w-full text-center font-semibold text-purple-600 hover:text-pink-500 hover:underline"
        >
          Tạo tài khoản mới
        </button>

      </form>

    </div>

  </div>
)}
{/* =====================================================
    QUẢNG CÁO GÓC NHỎ
===================================================== */}
<div className="fixed bottom-4 right-4 z-50 w-72 overflow-hidden rounded-xl bg-white shadow-2xl">

  {/* Nút X đóng quảng cáo */}
  <button
    type="button"
    className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white transition hover:bg-black/80"
    onClick={(event) => {
      const ad = event.currentTarget.parentElement;
      if (ad) {
        ad.style.display = "none";
      }
    }}
    aria-label="Đóng quảng cáo"
  >
    ×
  </button>

  {/* Nội dung quảng cáo */}
  <a
    href="#"
    className="block transition hover:opacity-90"
  >

    {/* Phần hình ảnh quảng cáo */}
    <div className="relative h-32 overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500">

      <div className="absolute inset-0 flex items-center px-4">

        <div className="text-4xl">
          📚
        </div>

        <div className="ml-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide">
            QUẢNG CÁO
          </p>

          <h3 className="mt-1 text-lg font-extrabold leading-tight">
            Đọc truyện mới mỗi ngày
          </h3>

          <p className="mt-1 text-xs text-white/90">
            Nhiều truyện mới đang được cập nhật!
          </p>
        </div>

      </div>
    </div>

    {/* Phần dưới */}
    <div className="flex items-center justify-between gap-3 p-3">

      <div>
        <p className="text-xs font-semibold text-purple-500">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-sm font-bold text-purple-900">
          Khám phá ngay →
        </p>
      </div>

      <span className="shrink-0 rounded-lg bg-purple-700 px-3 py-2 text-xs font-bold text-white">
        Xem
      </span>

    </div>

  </a>

</div>
    </main>
  );
}