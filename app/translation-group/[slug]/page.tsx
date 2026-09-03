"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MangaCard from "@/app/components/MangaCard";

type Manga = {
  id: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
  views: number;
};

type TranslationGroup = {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  description: string | null;
  mangas: Manga[];
  _count: {
    mangas: number;
  };
};

export default function TranslationGroupPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] =
    useState<TranslationGroup | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGroup = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/translation-groups/${slug}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Không thể tải nhóm dịch.",
          );
        }

        setGroup(data.group);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải nhóm dịch.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadGroup();
  }, [slug]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-gray-500">
          Đang tải nhóm dịch...
        </p>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">
          Không tìm thấy nhóm dịch
        </h1>

        <p className="mt-2 text-gray-500">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-purple-600">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {group.name}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {group._count.mangas} truyện
            </p>
          </div>
        </div>

        {group.description && (
          <p className="mt-5 max-w-3xl text-gray-600">
            {group.description}
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold text-gray-900">
          Truyện của nhóm
        </h2>

        {group.mangas.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-10 text-center text-gray-500">
            Chưa có truyện nào
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {group.mangas.map((manga) => (
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
    </main>
  );
}