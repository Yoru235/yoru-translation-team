"use client";

import { useEffect, useState } from "react";
import Comments from "@/components/Comments";
type ChapterImage = {
  id: string;
  imageUrl: string;
  fileName: string;
  order: number;
};

type MangaInfo = {
  id: string;
  title: string;
  coverUrl: string | null;
  type: string;
  isLocked: boolean;
  passwordHint: string | null;
};

type Chapter = {
  id: string;
  mangaId: string;
  volume: number | null;
  chapter: number;
  isLocked: boolean;
  passwordHint: string | null;
  images: ChapterImage[];
  manga: MangaInfo;
};

type ChapterResponse = {
  success: boolean;
  chapter?: Chapter;
  error?: string;
};

type ChapterListItem = {
  id: string;
  chapter: number;
  volume: number | null;
};

type ChapterListResponse = {
  success: boolean;
  chapters?: ChapterListItem[];
  error?: string;
};

type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export default function ChapterReaderPage({
  params,
}: PageProps) {
  const [chapterId, setChapterId] =
    useState("");

  const [chapter, setChapter] =
    useState<Chapter | null>(null);

  const [chapters, setChapters] =
    useState<ChapterListItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");
    const [password, setPassword] = useState("");
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  useEffect(() => {
    let cancelled = false;


    const loadChapter = async () => {
      try {
        setIsLoading(true);
        setError("");

        const resolvedParams = await params;

        if (cancelled) return;

        setChapterId(resolvedParams.chapterId);

        const response = await fetch(
          `/api/admin/chapter?chapterId=${encodeURIComponent(
            resolvedParams.chapterId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as ChapterResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Không thể tải chapter."
          );
        }

        if (!data.chapter) {
          throw new Error(
            "Không tìm thấy dữ liệu chapter."
          );
        }

        if (cancelled) return;

        setChapter(data.chapter);
        
        if (data.chapter.isLocked) {
  setChapter(data.chapter);
  setIsLoading(false);
  return;
}
await fetch("/api/history", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    chapterId: data.chapter.id,
  }),
});
        await fetch("/api/view", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    mangaId: data.chapter.mangaId,
  }),
});

        const mangaResponse =
          await fetch(
            `/api/admin/chapter?mangaId=${encodeURIComponent(
              data.chapter.mangaId
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const mangaData =
          (await mangaResponse.json()) as ChapterListResponse;

        if (
          mangaResponse.ok &&
          mangaData.success &&
          Array.isArray(
            mangaData.chapters
          )
        ) {
          setChapters(
            mangaData.chapters.sort(
              (a, b) =>
                a.chapter - b.chapter
            )
          );
        }
      } catch (err) {
        console.error(
          "LOAD CHAPTER ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải chapter."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadChapter();

    return () => {
      cancelled = true;
    };
  }, [params]);
    useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        setIsLoggedIn(
          response.ok &&
          data.success === true &&
          !!data.user
        );
      } catch (error) {
        console.error("CHECK LOGIN ERROR:", error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingLogin(false);
      }
    };

    void checkLogin();
  }, []);

  const currentIndex =
    chapters.findIndex(
      (item) =>
        item.id === chapterId
    );

  const previousChapter =
    currentIndex > 0
      ? chapters[currentIndex - 1]
      : null;

  const nextChapter =
    currentIndex >= 0 &&
    currentIndex <
      chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;
if (isCheckingLogin) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-pink-500" />

          <p className="mt-5 text-lg font-semibold text-gray-300">
            Đang kiểm tra tài khoản...
          </p>
        </div>
      </div>
    </main>
  );
}

if (!isLoggedIn) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-8 text-center">
          <div className="text-5xl">🔒</div>

          <h1 className="mt-4 text-2xl font-bold">
            Cần đăng nhập để đọc
          </h1>

          <p className="mt-3 text-gray-400">
            Bạn cần đăng nhập tài khoản Yoru để tiếp tục đọc truyện.
          </p>

          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 font-bold text-white transition hover:opacity-90"
          >
            Đăng nhập
          </a>

          <a
            href="/"
            className="mt-3 block text-sm text-gray-500 transition hover:text-gray-300"
          >
            ← Về trang chủ
          </a>
        </div>
      </div>
    </main>
  );
}
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-pink-500" />

            <p className="mt-5 text-lg font-semibold text-gray-300">
              Đang tải chapter...
            </p>
          </div>
        </div>
      </main>
    );
  }
if (chapter?.isLocked || chapter?.manga?.isLocked) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-yellow-900 bg-[#111111] p-8">

          <div className="text-center">
            <div className="text-5xl">🔒</div>

            <h1 className="mt-4 text-2xl font-bold">
  {chapter.manga.isLocked
    ? "Truyện đang bị khóa"
    : "Chapter đang bị khóa"}
</h1>

<p className="mt-3 text-gray-400">
  {chapter.manga.isLocked
    ? "Nhập mật khẩu để tiếp tục đọc truyện này."
    : "Nhập mật khẩu để tiếp tục đọc chapter này."}
</p>

            {chapter.passwordHint && (
              <p className="mt-3 text-sm text-yellow-400">
                Gợi ý: {chapter.passwordHint}
              </p>
            )}
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setUnlockError("");
            }}
            placeholder="Nhập mật khẩu"
            className="mt-6 w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-600"
          />

          {unlockError && (
            <p className="mt-3 text-sm font-semibold text-red-400">
              {unlockError}
            </p>
          )}

          <button
            type="button"
            onClick={async () => {
  setIsUnlocking(true);
  setUnlockError("");

  try {
    const response = await fetch("/api/chapter/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
  chapter.manga.isLocked
    ? {
        mangaId: chapter.manga.id,
        password,
      }
    : {
        chapterId: chapter.id,
        password,
      }
),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Mật khẩu không đúng."
      );
    }

setIsUnlocked(true);

setChapter((current) => {
  if (!current) {
    return current;
  }

  if (current.manga.isLocked) {
    // Mở khóa toàn bộ truyện
    return {
      ...current,
      isLocked: false,
      manga: {
        ...current.manga,
        isLocked: false,
      },
    };
  }

  // Chỉ mở khóa chapter này
  return {
    ...current,
    isLocked: false,
  };
});
  } catch (error) {
    setUnlockError(
      error instanceof Error
        ? error.message
        : "Không thể mở khóa Chapter."
    );
  } finally {
    setIsUnlocking(false);
  }
}}
            disabled={isUnlocking}
            className="mt-4 w-full rounded-xl bg-yellow-700 px-5 py-3 font-bold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlocking
              ? "⏳ Đang kiểm tra..."
              : "🔓 Mở khóa"}
          </button>

        </div>
      </div>
    </main>
  );
}
  if (error || !chapter) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-[#111111] p-8 text-center">
            <div className="text-5xl">
              ⚠️
            </div>

            <h1 className="mt-4 text-2xl font-bold">
              Không thể tải chapter
            </h1>

            <p className="mt-3 text-gray-400">
              {error ||
                "Không tìm thấy chapter."}
            </p>

            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 font-bold text-white transition hover:opacity-90"
            >
              ← Về trang chủ
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">

          <a
            href="/"
            className="flex items-center gap-3"
          >
            <img
              src="/logo.png"
              alt="Yoru Translation Group"
              className="h-10 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="font-extrabold text-white">
                Yoru Translation Group
              </p>

              <p className="text-xs text-gray-500">
                Đọc truyện
              </p>
            </div>
          </a>

          <a
            href="/"
            className="rounded-xl border border-gray-700 bg-[#111111] px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-pink-600 hover:text-pink-400"
          >
            ← Trang chủ
          </a>

        </div>
      </header>

      {/* THÔNG TIN CHAPTER */}

      <section className="border-b border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center">

          <p className="text-sm font-semibold text-purple-400">
            {chapter.manga.type}
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            {chapter.manga.title}
          </h1>

          <p className="mt-2 text-lg font-semibold text-gray-400">
            {chapter.volume !== null
              ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}`
              : `Chapter ${chapter.chapter}`}
          </p>

        </div>
      </section>

      {/* THANH ĐIỀU HƯỚNG */}

      <div className="sticky top-16 z-40 border-b border-gray-900 bg-black/95 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4">

          {previousChapter ? (
            <a
              href={`/chapter/${previousChapter.id}`}
              className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-purple-900 hover:text-white"
            >
              ← Chap trước
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-xl bg-[#0d0d0d] px-4 py-2 text-sm font-bold text-gray-700">
              ← Chap trước
            </span>
          )}

          <a
            href="/"
            className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            Danh sách
          </a>

          {nextChapter ? (
            <a
              href={`/chapter/${nextChapter.id}`}
              className="rounded-xl bg-[#171717] px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-purple-900 hover:text-white"
            >
              Chap sau →
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-xl bg-[#0d0d0d] px-4 py-2 text-sm font-bold text-gray-700">
              Chap sau →
            </span>
          )}

        </div>
      </div>

      {/* ẢNH CHAPTER */}

      <section className="bg-black">
        <div className="mx-auto max-w-5xl">

          {chapter.images.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="text-5xl">
                🖼️
              </div>

              <p className="mt-4 text-lg font-bold text-gray-300">
                Chapter chưa có ảnh.
              </p>
            </div>
          ) : (
            <div
  className="yoru-reader-images flex flex-col items-center select-none"
  onContextMenu={(event) => event.preventDefault()}
  onDragStart={(event) => event.preventDefault()}
  onCopy={(event) => event.preventDefault()}
>

              {chapter.images.map((image) => (
  <div
    key={image.id}
    className="relative w-full"
  >
   <img
  src={image.imageUrl}
  alt={`${chapter.manga.title} - Chapter ${chapter.chapter} - ${image.fileName}`}
  className="block h-auto w-full select-none"
  draggable={false}
  loading={
    image.order <= 2
      ? "eager"
      : "lazy"
  }
  decoding="async"
/>

  </div>
))}

            </div>
          )}

        </div>
      </section>

      {/* CUỐI CHAPTER */}

      <section className="border-t border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-10">

          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500">
              Bạn đã đọc xong
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-white">
              {chapter.manga.title}
            </h2>

            <p className="mt-1 text-gray-400">
              {chapter.volume !== null
                ? `Vol. ${chapter.volume} — Chapter ${chapter.chapter}`
                : `Chapter ${chapter.chapter}`}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">

            {previousChapter && (
              <a
                href={`/chapter/${previousChapter.id}`}
                className="rounded-xl border border-gray-700 bg-[#151515] px-6 py-3 text-center font-bold text-gray-200 transition hover:border-purple-600 hover:bg-purple-900/30"
              >
                ← Chapter{" "}
                {previousChapter.chapter}
              </a>
            )}

            {nextChapter && (
              <a
                href={`/chapter/${nextChapter.id}`}
                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-3 text-center font-bold text-white transition hover:opacity-90"
              >
                Chapter{" "}
                {nextChapter.chapter} →
              </a>
            )}

          </div>

          {!nextChapter && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Bạn đang ở chapter mới nhất.
            </p>
          )}

        </div>
      </section>
      {/* BÌNH LUẬN KHI ĐỌC CHAPTER */}

      <section className="border-t border-gray-900 bg-[#080808]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Comments
            mangaId={chapter.manga.id}
            chapterId={chapter.id}
          />
        </div>
      </section>
      {/* FOOTER */}

      <footer className="border-t border-gray-900 bg-black px-6 py-8 text-center">

        <p className="font-semibold text-gray-300">
          Yoru Translation Group
        </p>

        <p className="mt-1 text-xs text-gray-600">
          © Yoru Translation Group
        </p>

      </footer>

    </main>
  );
}