"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMangaUrl } from "@/lib/manga-url";
import { toMediaUrl } from "@/lib/media";

type Manga = {
  id: string;
  title: string;
  originalTitle?: string | null;
  description?: string | null;
  translationGroup?:
  | string
  | {
    id: string;
    name: string;
    slug: string;
    avatar?: string | null;
  }
  | null;
  type: string;
  status: string;
  ageRestricted?: boolean;
  coverUrl: string | null;
  creditUrl?: string | null;
  genres?: string[];
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

type HomePageClientProps = {
  initialMangaList?: Manga[];
  initialTranslationGroups?: TranslationGroup[];
};

export default function HomePageClient({
  initialMangaList = [],
  initialTranslationGroups = [],
}: HomePageClientProps) {
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mangaList, setMangaList] = useState<Manga[]>(initialMangaList);
  const [translationGroups, setTranslationGroups] = useState<
    TranslationGroup[]
  >(initialTranslationGroups);
  const [isLoading, setIsLoading] = useState(initialMangaList.length === 0);

  // Đăng nhập / Auth
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

    // Nếu dữ liệu SSR đã được truyền sang, không cần re-fetch từ API khi client mount
    if (initialMangaList.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadMangas = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/mangas", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as MangaApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể tải danh sách truyện.");
        }

        if (!cancelled) {
          setMangaList(Array.isArray(data.mangas) ? data.mangas : []);
        }
      } catch (error) {
        console.error("LOAD MANGA ERROR:", error);

        if (!cancelled && initialMangaList.length === 0) {
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
  }, [initialMangaList.length]);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as any;

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
    if (initialTranslationGroups.length > 0) {
      return;
    }

    const loadTranslationGroups = async () => {
      try {
        const response = await fetch("/api/translation-groups", {
          cache: "no-store",
        });

        const data = (await response.json()) as any;

        if (data.success && Array.isArray(data.groups)) {
          setTranslationGroups(data.groups);
        }
      } catch (error) {
        console.error("Lỗi tải nhóm dịch:", error);
      }
    };

    void loadTranslationGroups();
  }, [initialTranslationGroups.length]);

  // Bộ lọc dữ liệu truyện theo tab & từ khóa tìm kiếm
  const filteredList = mangaList.filter((manga) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      keyword === "" ||
      manga.title.toLowerCase().includes(keyword) ||
      (manga.originalTitle &&
        manga.originalTitle.toLowerCase().includes(keyword));

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "manga" && manga.type?.toLowerCase() === "manga") ||
      (activeFilter === "manhwa" && manga.type?.toLowerCase() === "manhwa") ||
      (activeFilter === "manhua" && manga.type?.toLowerCase() === "manhua") ||
      (activeFilter === "novel" && manga.type?.toLowerCase() === "novel") ||
      (activeFilter === "ongoing" &&
        manga.status?.toLowerCase() === "ongoing") ||
      (activeFilter === "completed" &&
        manga.status?.toLowerCase() === "completed") ||
      (activeFilter === "group" && Boolean(manga.translationGroup));

    return matchesSearch && matchesFilter;
  });

  // Truyện mới cập nhật (sắp xếp theo thời gian cập nhật mới nhất)
  const updatedMangas = [...filteredList].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Truyện nổi bật (sắp xếp theo lượt xem cao nhất)
  const hotMangas = [...filteredList].sort(
    (a, b) => (b.views || 0) - (a.views || 0)
  );

  // Top 12 truyện mới cập nhật
  const latest12Mangas = updatedMangas.slice(0, 12);

  // Top 10 truyện nổi bật
  const top10HotMangas = hotMangas.slice(0, 10);

  // Banner slidebar (lấy 7 truyện hot nhất khi ở trang chủ)
  const bannerManga = mangaList
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 7);

  useEffect(() => {
    if (bannerManga.length <= 1 || isFeaturedPaused || activeFilter !== "all")
      return;

    const timer = setInterval(() => {
      setFeaturedIndex((current) => {
        if (bannerManga.length === 0) return 0;
        return (current + 1) % bannerManga.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [bannerManga.length, isFeaturedPaused, activeFilter]);

  useEffect(() => {
    if (bannerManga.length > 0 && featuredIndex >= bannerManga.length) {
      setFeaturedIndex(0);
    }
  }, [bannerManga.length, featuredIndex]);

  const getBannerIndex = (offset: number) => {
    if (bannerManga.length === 0) return 0;
    return (featuredIndex + offset + bannerManga.length) % bannerManga.length;
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginUsername.trim() || !loginPassword.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setIsLoggedIn(true);
    setShowLogin(false);

    setLoginUsername("");
    setLoginPassword("");
  };

  // Đường dẫn chuyển đến trang xem full theo bộ lọc hiện tại
  const getSeeMoreUrl = () => {
    if (activeFilter === "manga") return "/manga?type=manga";
    if (activeFilter === "manhwa") return "/manhwa";
    if (activeFilter === "manhua") return "/manhua";
    if (activeFilter === "novel") return "/novel";
    if (activeFilter === "ongoing") return "/manga?status=ongoing";
    if (activeFilter === "completed") return "/manga?status=completed";
    return "/manga";
  };

  const getFilterTitle = () => {
    switch (activeFilter) {
      case "manga":
        return "Manga Mới Cập Nhật";
      case "manhwa":
        return "Manhwa Mới Cập Nhật";
      case "manhua":
        return "Manhua Mới Cập Nhật";
      case "novel":
        return "Novel Mới Cập Nhật";
      case "ongoing":
        return "Truyện Đang Tiến Hành";
      case "completed":
        return "Truyện Đã Hoàn Thành";
      default:
        return "Truyện Mới Cập Nhật";
    }
  };

  return (
    <main
      className={`min-h-screen font-sans ${darkMode
          ? "bg-gradient-to-b from-[#12091a] via-[#1d0d27] to-[#28102a] text-white"
          : "bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] text-purple-950"
        }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#4b176d] via-[#8e278f] to-[#d13b91] shadow-lg">
        <div className="mx-auto flex min-h-[70px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* LOGO + TÊN NHÓM */}
          <a href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-11 w-auto object-contain transition group-hover:scale-105"
            />
            <span className="text-xl font-extrabold text-white tracking-wide">
              Yoru Translation Group
            </span>
          </a>

          {/* TÌM KIẾM + DARK MODE + ĐĂNG NHẬP */}
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm truyện..."
              className="w-28 sm:w-52 rounded-xl border border-white/30 bg-white/95 px-3.5 py-2 text-sm text-purple-950 outline-none placeholder:text-purple-400 focus:ring-2 focus:ring-pink-300 transition"
            />

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl bg-white/20 px-3 py-2 text-lg text-white backdrop-blur transition hover:bg-white/30"
              title="Đổi giao diện"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* ĐĂNG NHẬP / USER MENU */}
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="rounded-xl bg-white px-4 sm:px-5 py-2 text-sm font-extrabold text-purple-700 shadow-md transition hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-lg"
              >
                Đăng nhập
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-md transition hover:bg-purple-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 text-sm font-extrabold text-white">
                    {currentUser?.avatar ? (
                      <img
                        src={toMediaUrl(currentUser.avatar)}
                        alt={currentUser.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      currentUser?.username?.charAt(0).toUpperCase() || "Y"
                    )}
                  </div>
                  <span className="hidden max-w-[100px] truncate text-sm font-extrabold text-purple-800 sm:block">
                    {currentUser?.username || "Tài khoản"}
                  </span>
                  <span
                    className={`text-xs text-purple-500 transition-transform ${showUserMenu ? "rotate-180" : ""
                      }`}
                  >
                    ▼
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 z-[100] w-60 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl">
                    <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
                      <p className="truncate text-sm font-extrabold text-purple-900">
                        {currentUser?.username || "Tài khoản"}
                      </p>
                      <p className="truncate text-xs text-purple-500">
                        {currentUser?.email || ""}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-pink-500">
                        {currentUser?.role || "READER"}
                      </p>
                    </div>

                    <div className="p-2 text-sm">
                      <a
                        href="/profile"
                        className="flex items-center rounded-xl px-3.5 py-2 font-semibold text-purple-800 transition hover:bg-purple-50"
                      >
                        Hồ sơ cá nhân
                      </a>
                      <a
                        href="/bookmark"
                        className="flex items-center rounded-xl px-3.5 py-2 font-semibold text-purple-800 transition hover:bg-purple-50"
                      >
                        Truyện đã lưu
                      </a>
                      <a
                        href="/history"
                        className="flex items-center rounded-xl px-3.5 py-2 font-semibold text-purple-800 transition hover:bg-purple-50"
                      >
                        Lịch sử đọc
                      </a>

                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/auth/logout", {
                              method: "POST",
                            });
                            const data = (await response.json()) as any;
                            if (!response.ok || !data.success) {
                              throw new Error(
                                data.error || "Không thể đăng xuất."
                              );
                            }
                            setIsLoggedIn(false);
                            setCurrentUser(null);
                            setShowUserMenu(false);
                            router.refresh();
                          } catch (error) {
                            console.error("LOGOUT ERROR:", error);
                          }
                        }}
                        className="flex w-full items-center rounded-xl px-3.5 py-2 text-left font-semibold text-red-500 transition hover:bg-red-50"
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
          MENU ĐIỀU HƯỚNG
      ===================================================== */}
      <nav
        className={`shadow-md sticky top-[70px] z-40 backdrop-blur-md ${darkMode
            ? "bg-[#200d2e]/95 border-b border-purple-900/50"
            : "bg-gradient-to-r from-[#551b78] via-[#8b258e] to-[#bd2688]"
          }`}
      >
        <div className="mx-auto flex max-w-7xl gap-4 sm:gap-7 overflow-x-auto px-4 sm:px-6 py-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "all"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Trang chủ
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("manga")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "manga"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manga
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("manhwa")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "manhwa"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manhwa
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("manhua")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "manhua"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manhua
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("novel")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "novel"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Novel
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("ongoing")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "ongoing"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Đang tiến hành
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("completed")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "completed"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Đã hoàn thành
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("group")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeFilter === "group"
                ? "bg-white/25 text-pink-200 shadow-sm"
                : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Nhóm dịch
          </button>
        </div>
      </nav>

      {/* =====================================================
          SLIDEBAR (CHỈ HIỆN KHI Ở TRANG CHỦ / activeFilter === 'all')
      ===================================================== */}
      {activeFilter === "all" && bannerManga.length > 0 && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div
            className="relative h-[320px] sm:h-[380px] overflow-hidden rounded-3xl bg-gradient-to-r from-gray-950 via-[#180a22] to-gray-950 shadow-2xl border border-purple-900/30"
            onMouseEnter={() => setIsFeaturedPaused(true)}
            onMouseLeave={() => setIsFeaturedPaused(false)}
          >
            {/* DẢI BÌA CAROUSEL */}
            <div className="absolute inset-0 flex items-center justify-center">
              {bannerManga.map((manga, index) => {
                const total = bannerManga.length;
                let offset = index - featuredIndex;

                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const absOffset = Math.abs(offset);
                const isCenter = offset === 0;
                const isVisible = absOffset <= 3;

                if (!isVisible) return null;

                const coverSrc = toMediaUrl(manga.coverUrl);

                return (
                  <button
                    key={manga.id}
                    type="button"
                    onClick={() => router.push(getMangaUrl(manga))}
                    className="absolute left-1/2 top-1/2 origin-center transition-all duration-700 ease-in-out cursor-pointer"
                    style={{
                      transform: `
                        translate(-50%, -50%)
                        translateX(${offset * (typeof window !== "undefined" && window.innerWidth < 640 ? 110 : 170)}px)
                        scale(${isCenter ? 1.12 : absOffset === 1 ? 0.95 : 0.82})
                      `,
                      zIndex: 20 - absOffset,
                      opacity:
                        absOffset === 3 ? 0.4 : absOffset === 2 ? 0.7 : 1,
                    }}
                  >
                    <div
                      className={`relative h-[240px] w-[160px] sm:h-[290px] sm:w-[195px] overflow-hidden rounded-2xl bg-gray-900 shadow-2xl transition-all duration-700 ${isCenter
                          ? "ring-4 ring-pink-400 shadow-pink-500/30"
                          : "ring-1 ring-white/10"
                        }`}
                    >
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={manga.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-white">
                          {manga.title}
                        </div>
                      )}

                      {/* Thông tin trên ảnh bìa trung tâm */}
                      {isCenter && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-left">
                          <p className="line-clamp-1 text-xs font-bold text-white sm:text-sm">
                            {manga.title}
                          </p>
                          <p className="text-[11px] font-semibold text-pink-400">
                            {manga.type} · ❤️ {manga.views.toLocaleString("vi-VN")}
                          </p>
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
              className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur transition hover:bg-black/80 hover:scale-110"
              aria-label="Bìa trước"
            >
              ‹
            </button>

            {/* NÚT PHẢI */}
            <button
              type="button"
              onClick={() => setFeaturedIndex(getBannerIndex(1))}
              className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur transition hover:bg-black/80 hover:scale-110"
              aria-label="Bìa tiếp theo"
            >
              ›
            </button>

            {/* CHẤM CHUYỂN BÌA */}
            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {bannerManga.map((manga, index) => (
                <button
                  key={manga.id}
                  type="button"
                  onClick={() => setFeaturedIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === featuredIndex
                      ? "w-6 bg-pink-400"
                      : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  aria-label={`Chuyển đến bìa ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          NỘI DUNG CHÍNH (TRANG CHỦ HOẶC LỌC THEO TYPE)
      ===================================================== */}
      {activeFilter === "group" ? (
        /* NHÓM DỊCH */
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <div className="mb-7">
            <h2
              className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? "text-pink-200" : "text-purple-900"
                }`}
            >
              Nhóm Dịch
            </h2>
            <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          </div>

          {translationGroups.length === 0 ? (
            <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
              <p className="font-semibold text-purple-600">
                Chưa có nhóm dịch nào.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {translationGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    router.push(`/translation-group/${group.slug}`)
                  }
                  className={`group rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:shadow-lg ${darkMode
                      ? "border-purple-900 bg-[#24152f]"
                      : "border-purple-100 bg-white shadow-sm"
                    }`}
                >
                  <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-purple-100 ring-2 ring-purple-300/50">
                    {group.avatar ? (
                      <img
                        src={toMediaUrl(group.avatar)}
                        alt={group.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-purple-600">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3
                    className={`mt-4 line-clamp-2 text-sm font-bold ${darkMode
                        ? "text-white group-hover:text-pink-300"
                        : "text-gray-900 group-hover:text-purple-600"
                      }`}
                  >
                    {group.name}
                  </h3>

                  <p
                    className={`mt-1 text-xs ${darkMode ? "text-purple-300" : "text-gray-500"
                      }`}
                  >
                    {group._count?.mangas ?? 0} truyện
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* KHU VỰC 2 CỘT: TRUYỆN MỚI CẬP NHẬT (12 BỘ) & TRUYỆN NỔI BẬT (TOP 10 DỌC) */
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* CỘT CHÍNH: TRUYỆN MỚI CẬP NHẬT (12 BỘ) */}
            <div className="lg:col-span-8">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2
                    className={`text-2xl sm:text-3xl font-extrabold flex items-center gap-2 ${darkMode ? "text-pink-200" : "text-purple-900"
                      }`}
                  >
                    <span className="text-pink-500">⚡</span> {getFilterTitle()}
                  </h2>
                  <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
                </div>

                <a
                  href={getSeeMoreUrl()}
                  className={`hidden sm:inline-flex items-center gap-1 text-sm font-bold transition hover:gap-2 ${darkMode
                      ? "text-pink-300 hover:text-pink-200"
                      : "text-purple-700 hover:text-purple-900"
                    }`}
                >
                  Xem full →
                </a>
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-purple-100 bg-white/50 p-12 text-center shadow-sm">
                  <p className="font-semibold text-purple-600">
                    Đang nạp danh sách truyện...
                  </p>
                </div>
              ) : latest12Mangas.length === 0 ? (
                <div className="rounded-2xl border border-purple-100 bg-white/50 p-12 text-center shadow-sm">
                  <p className="font-semibold text-purple-600">
                    Chưa có truyện nào phù hợp.
                  </p>
                </div>
              ) : (
                <>
                  {/* GRID 12 TRUYỆN */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 md:grid-cols-4">
                    {latest12Mangas.map((manga) => {
                      const coverSrc = toMediaUrl(manga.coverUrl);

                      return (
                        <a
                          key={manga.id}
                          href={getMangaUrl(manga)}
                          className={`group flex flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1.5 hover:shadow-xl ${darkMode
                              ? "border-purple-900/60 bg-[#21122b] hover:border-pink-500/50"
                              : "border-purple-100 bg-white shadow-sm hover:border-purple-300"
                            }`}
                        >
                          {/* ẢNH BÌA */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-purple-100">
                            {coverSrc ? (
                              <img
                                src={coverSrc}
                                alt={manga.title}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-purple-400">
                                Chưa có ảnh bìa
                              </div>
                            )}

                            {/* TYPE BADGE */}
                            <span className="absolute top-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-bold text-pink-300 backdrop-blur-md">
                              {manga.type || "Manga"}
                            </span>

                            {/* STATUS BADGE */}
                            <span
                              className={`absolute top-2 right-2 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white ${manga.status === "completed"
                                  ? "bg-emerald-600/90"
                                  : "bg-purple-600/90"
                                }`}
                            >
                              {manga.status === "completed" ? "Full" : "Đang ra"}
                            </span>
                          </div>

                          {/* THÔNG TIN */}
                          <div className="flex flex-1 flex-col justify-between p-3">
                            <div>
                              <h3
                                className={`line-clamp-2 text-xs sm:text-sm font-bold transition group-hover:text-pink-500 ${darkMode ? "text-white" : "text-purple-950"
                                  }`}
                                title={manga.title}
                              >
                                {manga.title}
                              </h3>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-pink-500">
                                ❤️ {manga.views.toLocaleString("vi-VN")}
                              </span>
                              <span
                                className={
                                  darkMode ? "text-purple-300" : "text-purple-400"
                                }
                              >
                                {new Date(manga.updatedAt).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>

                  {/* NÚT XEM THÊM DẪN QUA TRANG FULL */}
                  <div className="mt-8 text-center">
                    <a
                      href={getSeeMoreUrl()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-purple-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:opacity-95"
                    >
                      <span>Xem tất cả truyện mới cập nhật</span>
                      <span className="text-lg">→</span>
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* CỘT PHẢI: TRUYỆN NỔI BẬT (TOP 10 HIỆN DỌC XUỐNG) */}
            <div className="lg:col-span-4">
              <div className="mb-6">
                <h2
                  className={`text-2xl sm:text-3xl font-extrabold flex items-center gap-2 ${darkMode ? "text-pink-200" : "text-purple-900"
                    }`}
                >
                  <span className="text-amber-400">👑</span> Truyện Nổi Bật
                </h2>
                <p className="mt-1 text-xs text-purple-400">
                  Bảng xếp hạng Top 10 lượt xem cao nhất
                </p>
                <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-amber-500 to-pink-500" />
              </div>

              {top10HotMangas.length === 0 ? (
                <div className="rounded-2xl border border-purple-100 bg-white/50 p-6 text-center shadow-sm">
                  <p className="text-xs text-purple-500">
                    Chưa có truyện nổi bật.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {top10HotMangas.map((manga, index) => {
                    const rank = index + 1;
                    const coverSrc = toMediaUrl(manga.coverUrl);

                    // Phong cách huy hiệu thứ hạng
                    const rankBadgeStyle =
                      rank === 1
                        ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-white ring-2 ring-amber-300 shadow-md shadow-amber-500/30"
                        : rank === 2
                          ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-200 shadow-md"
                          : rank === 3
                            ? "bg-gradient-to-br from-orange-400 to-amber-700 text-white ring-2 ring-orange-300 shadow-md"
                            : darkMode
                              ? "bg-purple-950/70 text-purple-300 border border-purple-800"
                              : "bg-purple-50 text-purple-700 border border-purple-100";

                    return (
                      <a
                        key={`hot-rank-${manga.id}`}
                        href={getMangaUrl(manga)}
                        className={`group flex items-center gap-3.5 rounded-2xl border p-2.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${darkMode
                            ? "border-purple-900/60 bg-[#21122b]/80 hover:bg-[#2c173a] hover:border-pink-500/40"
                            : "border-purple-100 bg-white hover:bg-purple-50/40 hover:border-purple-300"
                          }`}
                      >
                        {/* HUY HIỆU THỨ HẠNG */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${rankBadgeStyle}`}
                        >
                          {rank < 10 ? `0${rank}` : rank}
                        </div>

                        {/* ẢNH BÌA NHỎ */}
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-purple-100">
                          {coverSrc ? (
                            <img
                              src={coverSrc}
                              alt={manga.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-purple-400">
                              No cover
                            </div>
                          )}
                        </div>

                        {/* THÔNG TIN TRUYỆN */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`line-clamp-1 text-sm font-bold transition group-hover:text-pink-500 ${darkMode ? "text-white" : "text-purple-950"
                              }`}
                            title={manga.title}
                          >
                            {manga.title}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="rounded bg-pink-500/10 px-1.5 py-0.5 text-[10px] font-bold text-pink-500">
                              {manga.type || "Manga"}
                            </span>

                            <span className="text-[11px] font-semibold text-amber-500">
                              ❤️ {manga.views.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="mt-20 bg-gradient-to-r from-[#4b176d] via-[#812681] to-[#c9328d] px-6 py-10 text-center text-white">
        <img
          src="/logo.png"
          alt="Yoru Translation Group"
          className="mx-auto mb-4 h-16 w-auto object-contain"
        />

        <h3 className="text-xl font-bold">Yoru Translation Group</h3>

        <p className="mt-2 text-sm text-purple-100">
          Manga · Manhwa · Manhua · Novel
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

      {/* MODAL ĐĂNG NHẬP */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl text-purple-950"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="absolute right-5 top-5 text-2xl text-gray-400 transition hover:text-purple-700"
            >
              ×
            </button>

            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-purple-900">
                Đăng nhập
              </h2>
              <p className="mt-1 text-xs text-purple-500">
                Đăng nhập để lưu truyện, bookmark và theo dõi lịch sử đọc.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-purple-900">
                  Tên người dùng hoặc địa chỉ email
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  placeholder="Tên đăng nhập hoặc địa chỉ email"
                  className="w-full rounded-xl border border-purple-200 bg-purple-50/40 px-4 py-2.5 text-sm text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-purple-900">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full rounded-xl border border-purple-200 bg-purple-50/40 px-4 py-2.5 pr-10 text-sm text-purple-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-400"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>Quên mật khẩu?</div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 py-3 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                ĐĂNG NHẬP
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
