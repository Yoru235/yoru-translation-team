import { redirect } from "next/navigation";

export default async function AdminChapterPage({
  searchParams,
}: {
  searchParams: Promise<{
    mangaId?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.mangaId) {
    redirect(
      `/admin?tab=chapter&mangaId=${encodeURIComponent(
        params.mangaId
      )}`
    );
  }

  redirect("/admin?tab=chapter");
}