"use client";

import { useRouter } from "next/navigation";

type MangaCardProps = {
  id: string;
  title: string;
  coverUrl: string | null;
};

export default function MangaCard({
  id,
  title,
  coverUrl,
}: MangaCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/manga/${id}`)}
      className="group w-full text-left"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-xl bg-gray-200 shadow-sm">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-gray-500">
            Chưa có bìa
          </div>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-purple-600">
        {title}
      </h3>
    </button>
  );
}