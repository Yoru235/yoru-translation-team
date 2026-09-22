"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getMangaUrl } from "@/lib/manga-url";
import { toMediaUrl } from "@/lib/media";

type Manga = {
  id: string;
  title: string;
  originalTitle?: string | null;
  coverUrl: string | null;
  type: string;
  status: string;
  views?: number;
  updatedAt?: string;
  createdAt?: string;
};

type MangaResponse = {
  success: boolean;
  mangas?: Manga[];
  error?: string;
};

type MangaListPageClientProps = {
  initialMangas?: Manga[];
  defaultType?: string;
};

const PAGE_SIZE = 20;

export default function MangaListPageClient({
  initialMangas = [],
  defaultType,
}: MangaListPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Đọc params từ URL nếu có
  const typeParam = searchParams.get("type") || defaultType || "all";
  const statusParam = searchParams.get("status") || "all";
  const sortParam = searchParams.get("sort") || "updated";
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [mangas, setMangas] = useState<Manga[]>(initialMangas);
  const [isLoading, setIsLoading] = useState(initialMangas.length === 0);
  const [error, setError] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>(typeParam);
  const [selectedStatus, setSelectedStatus] = useState<string>(statusParam);
  const [selectedSort, setSelectedSort] = useState<string>(sortParam);
  const [currentPage, setCurrentPage] = useState<number>(pageParam);

  // Tab đang active trên menu bar (manga, manhwa, manhua, novel, ongoing, completed, hoặc all)
  const [activeMenuTab, setActiveMenuTab] = useState<string>(() => {
    if (statusParam === "ongoing" || statusParam === "completed") {
      return statusParam;
    }
    if (["manga", "manhwa", "manhua", "novel"].includes(typeParam.toLowerCase())) {
      return typeParam.toLowerCase();
    }
    return "all";
  });

  // Auth / User menu
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null>(null);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sync khi searchParams hoặc defaultType thay đổi
  useEffect(() => {
    if (statusParam === "ongoing" || statusParam === "completed") {
      setSelectedStatus(statusParam);
      setSelectedType("all");
      setActiveMenuTab(statusParam);
    } else if (["manga", "manhwa", "manhua", "novel"].includes(typeParam.toLowerCase())) {
      setSelectedType(typeParam.toLowerCase());
      setSelectedStatus("all");
      setActiveMenuTab(typeParam.toLowerCase());
    } else {
      setSelectedType("all");
      setSelectedStatus("all");
      setActiveMenuTab("all");
    }

    if (sortParam) setSelectedSort(sortParam);
    if (pageParam) setCurrentPage(pageParam);
  }, [typeParam, statusParam, sortParam, pageParam]);

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
    let cancelled = false;

    if (initialMangas.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadMangas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/mangas", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as MangaResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể tải danh sách truyện.");
        }

        if (!cancelled) {
          setMangas(data.mangas ?? []);
        }
      } catch (err) {
        console.error("LOAD MANGA LIST ERROR:", err);
        if (!cancelled && initialMangas.length === 0) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách truyện."
          );
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
  }, [initialMangas.length]);

  // Xử lý khi bấm nút trên Menu bar (Menu giống y hệt trang chủ)
  const handleMenuClick = (tab: string) => {
    if (tab === "home") {
      router.push("/");
      return;
    }
    if (tab === "group") {
      router.push("/#manga");
      return;
    }

    setActiveMenuTab(tab);
    setCurrentPage(1);

    if (tab === "ongoing" || tab === "completed") {
      setSelectedStatus(tab);
      setSelectedType("all");
    } else if (["manga", "manhwa", "manhua", "novel"].includes(tab)) {
      setSelectedType(tab);
      setSelectedStatus("all");
    } else {
      setSelectedType("all");
      setSelectedStatus("all");
    }
  };

  // Lọc và sắp xếp truyện
  const filteredAndSortedMangas = useMemo(() => {
    let list = mangas.filter((manga) => {
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        keyword === "" ||
        manga.title.toLowerCase().includes(keyword) ||
        (manga.originalTitle &&
          manga.originalTitle.toLowerCase().includes(keyword));

      const matchesType =
        selectedType === "all" ||
        manga.type?.toLowerCase() === selectedType.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        manga.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sắp xếp
    if (selectedSort === "views") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedSort === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    } else {
      // Mặc định mới cập nhật
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );
    }

    return list;
  }, [mangas, search, selectedType, selectedStatus, selectedSort]);

  // Phân trang 20 truyện mỗi trang
  const totalItems = filteredAndSortedMangas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMangas = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAndSortedMangas.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedMangas, safeCurrentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Xác định tiêu đề hiển thị
  const getPageHeading = () => {
    if (activeMenuTab === "manga") return "Danh Sách Manga";
    if (activeMenuTab === "manhwa") return "Danh Sách Manhwa";
    if (activeMenuTab === "manhua") return "Danh Sách Manhua";
    if (activeMenuTab === "novel") return "Danh Sách Novel";
    if (activeMenuTab === "ongoing") return "Truyện Đang Tiến Hành";
    if (activeMenuTab === "completed") return "Truyện Đã Hoàn Thành";
    return "Tất Cả Truyện";
  };

  // Điều kiện hiển thị các hàng bộ lọc:
  // - Nếu ở trang Full tất cả truyện (activeMenuTab === "all"): Hiện cả Thể loại và Trạng thái
  // - Nếu ở tab Thể loại cụ thể (manga, manhwa, manhua, novel): Chỉ hiện bộ lọc Trạng thái
  // - Nếu ở tab Trạng thái cụ thể (ongoing, completed): Chỉ hiện bộ lọc Thể loại
  const isSpecificTypeTab = ["manga", "manhwa", "manhua", "novel"].includes(
    activeMenuTab
  );
  const isSpecificStatusTab = ["ongoing", "completed"].includes(activeMenuTab);
  const isFullAllPage = activeMenuTab === "all";

  const showTypeFilterRow = isFullAllPage || isSpecificStatusTab;
  const showStatusFilterRow = isFullAllPage || isSpecificTypeTab;

  return (
    <main
      className={`min-h-screen font-sans ${darkMode
        ? "bg-gradient-to-b from-[#12091a] via-[#1d0d27] to-[#28102a] text-white"
        : "bg-gradient-to-b from-[#faf3ff] via-[#f8efff] to-[#fff0f8] text-purple-950"
        }`}
    >
      {/* =====================================================
          HEADER (TÁI SỬ DỤNG GIỐNG TRANG CHỦ)
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
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
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
          MENU ĐIỀU HƯỚNG (GIỮ NGUYÊN GIỐNG TRANG CHỦ, KHÔNG CÓ NÚT TẤT CẢ)
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
            onClick={() => handleMenuClick("home")}
            className="whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold text-white/90 transition hover:text-white hover:bg-white/10"
          >
            Trang chủ
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("manga")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "manga"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manga
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("manhwa")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "manhwa"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manhwa
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("manhua")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "manhua"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Manhua
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("novel")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "novel"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Novel
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("ongoing")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "ongoing"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Đang tiến hành
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("completed")}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${activeMenuTab === "completed"
              ? "bg-white/25 text-pink-200 shadow-sm"
              : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
          >
            Đã hoàn thành
          </button>

          <button
            type="button"
            onClick={() => handleMenuClick("group")}
            className="whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold text-white/90 transition hover:text-white hover:bg-white/10"
          >
            Nhóm dịch
          </button>
        </div>
      </nav>

      {/* =====================================================
          TIÊU ĐỀ & KHU VỰC BỘ LỌC TƯƠNG ỨNG
      ===================================================== */}
      <section
        className={`border-b ${darkMode
          ? "border-purple-900/40 bg-[#1e0e29]/70"
          : "border-purple-100 bg-white/70"
          } backdrop-blur`}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-extrabold flex items-center gap-2 ${darkMode ? "text-pink-200" : "text-purple-900"
                  }`}
              >
                <span className="text-pink-500">⚡</span> {getPageHeading()}
              </h1>
            </div>

            {/* SẮP XẾP */}
            <div className="flex items-center gap-2 self-start md:self-auto mt-2 md:mt-0">
              <span
                className={`text-xs font-bold ${darkMode ? "text-purple-300" : "text-purple-700"
                  }`}
              >
                Sắp xếp:
              </span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setCurrentPage(1);
                }}
                className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold outline-none transition ${darkMode
                  ? "border-purple-800 bg-[#291336] text-pink-200 focus:border-pink-500"
                  : "border-purple-200 bg-white text-purple-900 focus:border-purple-500"
                  }`}
              >
                <option value="updated">Mới cập nhật</option>
                <option value="views">Lượt xem nhiều nhất</option>
                <option value="title">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* DÒNG BỘ LỌC THỂ LOẠI (Chỉ hiện khi ở trang Full hoặc ở tab Trạng thái) */}
          {showTypeFilterRow && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold mr-1 ${darkMode ? "text-purple-400" : "text-purple-700"
                  }`}
              >
                Thể loại:
              </span>
              {[
                { label: "Tất cả", value: "all" },
                { label: "Manga", value: "manga" },
                { label: "Manhwa", value: "manhwa" },
                { label: "Manhua", value: "manhua" },
                { label: "Novel", value: "novel" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(t.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${selectedType.toLowerCase() === t.value.toLowerCase()
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-pink-500/20"
                    : darkMode
                      ? "border border-purple-800/80 bg-[#291336] text-purple-300 hover:border-purple-600 hover:text-white"
                      : "border border-purple-200 bg-purple-50/50 text-purple-800 hover:bg-purple-100"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* DÒNG BỘ LỌC TRẠNG THÁI (Chỉ hiện khi ở trang Full hoặc ở tab Thể loại như Novel, Manga...) */}
          {showStatusFilterRow && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold mr-1 ${darkMode ? "text-purple-400" : "text-purple-700"
                  }`}
              >
                Trạng thái:
              </span>
              {[
                { label: "Tất cả", value: "all" },
                { label: "Đang tiến hành", value: "ongoing" },
                { label: "Hoàn thành", value: "completed" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(s.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${selectedStatus.toLowerCase() === s.value.toLowerCase()
                    ? "bg-purple-600 text-white"
                    : darkMode
                      ? "border border-purple-900 bg-[#23102f] text-purple-400 hover:text-purple-200"
                      : "border border-purple-200 bg-purple-50/50 text-purple-800 hover:bg-purple-100"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          DANH SÁCH 20 TRUYỆN MỖI TRANG & PHÂN TRANG
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* LOADING */}
        {isLoading && (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-purple-400">
              Đang nạp danh sách truyện...
            </p>
          </div>
        )}

        {/* BÁO LỖI */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/30 px-6 py-10 text-center">
            <p className="font-bold text-red-400">{error}</p>
          </div>
        )}

        {/* KHÔNG CÓ KẾT QUẢ */}
        {!isLoading && !error && paginatedMangas.length === 0 && (
          <div
            className={`rounded-2xl border p-16 text-center shadow-md ${darkMode
              ? "border-purple-900/50 bg-[#1f0e2b]"
              : "border-purple-100 bg-white"
              }`}
          >
            <p
              className={`text-lg font-bold ${darkMode ? "text-pink-200" : "text-purple-900"
                }`}
            >
              Không tìm thấy bộ truyện nào.
            </p>
            <p
              className={`mt-1 text-sm ${darkMode ? "text-purple-400" : "text-purple-500"
                }`}
            >
              Vui lòng thử tìm kiếm bằng từ khóa hoặc bộ lọc khác.
            </p>
          </div>
        )}

        {/* LƯỚI TRUYỆN 20 BỘ */}
        {!isLoading && !error && paginatedMangas.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedMangas.map((manga) => {
              const coverSrc = toMediaUrl(manga.coverUrl);

              return (
                <a
                  key={manga.id}
                  href={getMangaUrl(manga)}
                  className={`group flex flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1.5 hover:shadow-xl ${darkMode
                    ? "border-purple-900/60 bg-[#21122b] hover:border-pink-500/50 hover:shadow-pink-500/10"
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
                        ❤️ {(manga.views || 0).toLocaleString("vi-VN")}
                      </span>
                      {manga.updatedAt && (
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
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* THANH PHÂN TRANG (PAGINATION - TỐI ĐA 4 TRANG ĐỂ NHẤN) */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 pb-8">
            {/* Nút Trước */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${darkMode
                ? "border-purple-800 bg-[#251233] text-purple-300 hover:border-pink-500 hover:text-white"
                : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                }`}
            >
              ← Trang trước
            </button>

            {/* Các số trang (Tối đa 4 trang hiển thị số để nhấn) */}
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 4) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (safeCurrentPage <= 2) {
                  pages.push(1, 2, 3, "...", totalPages);
                } else if (safeCurrentPage >= totalPages - 1) {
                  pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, "...", safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
                }
              }

              return pages.map((item, idx) => {
                if (item === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs font-bold text-purple-400"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = Number(item);
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-9 min-w-9 rounded-xl px-2.5 text-xs font-bold transition ${pageNum === safeCurrentPage
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-pink-500/20"
                      : darkMode
                        ? "border border-purple-900 bg-[#251233] text-purple-300 hover:border-purple-600 hover:text-white"
                        : "border border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            {/* Nút Sau */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${darkMode
                ? "border-purple-800 bg-[#251233] text-purple-300 hover:border-pink-500 hover:text-white"
                : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                }`}
            >
              Trang sau →
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          FOOTER (TÁI SỬ DỤNG GIỐNG TRANG CHỦ)
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
