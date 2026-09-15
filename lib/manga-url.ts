export function getMangaUrl(manga: {
  id: string;
  type?: string | null;
  slug?: string | null;
}): string {
  const type = (manga.type || "manga").toLowerCase();
  const identifier = manga.slug || manga.id;
  return `/${type}/${identifier}`;
}
