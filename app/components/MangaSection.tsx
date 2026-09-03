import MangaCard from "./MangaCard";

type Manga = {
  id: string;
  title: string;
  coverUrl: string | null;
};

type MangaSectionProps = {
  title: string;
  mangas: Manga[];
};

export default function MangaSection({
  title,
  mangas,
}: MangaSectionProps) {
  if (mangas.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="mb-5 text-2xl font-bold text-gray-900">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {mangas.map((manga) => (
          <MangaCard
            key={manga.id}
            id={manga.id}
            title={manga.title}
            coverUrl={manga.coverUrl}
          />
        ))}
      </div>
    </section>
  );
}