export interface Genre {
  id: string;
  name: string;
}

export const GENRES: Genre[] = [
  { id: "boylove", name: "Boylove" },
  { id: "action", name: "Hành động" },
  { id: "romance", name: "Romance" },
  { id: "shoujo", name: "Shoujo" },
  { id: "shojo-ai", name: "Shojo Ai" },
  { id: "fantasy", name: "Fantasy" },
  { id: "drama", name: "Drama" },
  { id: "comedy", name: "Comedy" },
  { id: "school-life", name: "School Life" },
  { id: "historical", name: "Historical" },
  { id: "mystery", name: "Trinh thám" },
  { id: "horror", name: "Kinh dị" },
  { id: "psychological", name: "Tâm lý" },
  { id: "insect", name: "Insect" },
  { id: "harem", name: "Harem" },
  { id: "confinement", name: "Giam cầm" },
  { id: "18-plus", name: "18+" },
  { id: "bdsm", name: "BDSM" },
  { id: "murder", name: "Sát nhân" },
  { id: "exhibitionism", name: "Exhibitionism" },
  { id: "revenge", name: "Nhân thù" },
  { id: "tentacle", name: "Xúc tu" },
  { id: "rape", name: "Rape" },
  { id: "transmigration", name: "Xuyên không" },
  { id: "ancient", name: "Cổ trang" },
  { id: "novel", name: "Novel" },
  { id: "Supernatural", name: "Siêu nhiên" },
  { id: "Adventure", name: "Phiêu lưu" },
  { id: "Humorous", name: "Hài hước" },
  { id: "Modern", name: "Hiện đại" },
  { id: "Younger partner (in a relationship)", name: "Niên hạ" },
  { id: "Vampire", name: "Ma cà rồng" },
  { id: "Doujinshi", name: "Doujinshi" },
  { id: "Esper/Guide", name: "Esper/Guide" },
  { id: "Many authors", name: "Nhiều tác giả" },
  { id: "Dom/Sub", name: "Dom/Sub" },
  { id: "The Royal Family", name: "Hoàng gia" },
  { id: "System", name: "Hệ thống" },
  { id: "The entertainment industry", name: "Giới giải trí" },
  { id: "Marriage first, love later", name: "Cưới trước yêu sau" },
  { id: "Ancient times", name: "Thời âu cổ" },
  { id: "ABO", name: "ABO" },
  { id: "Mpreg", name: "Nam mang thai" },
  { id: "Cuntboy", name: "Trôn có lài" },
  { id: "Superpower", name: "Siêu năng lực" },
  { id: "Duplicity", name: "Khẩu thị tâm phi" },
  { id: "Enemies to lovers", name: "Oan gia ngõ hẹp" },
  { id: "Mysterious", name: "Bí ẩn" },
  { id: "Vengeance", name: "Trả thù" },
  { id: "Manipulation", name: "Thao túng" },
  { id: "Non-human", name: "Phi nhân loại" },
];

// Bản đồ tra cứu nhanh id -> name và name -> name (không phân biệt hoa thường)
const GENRE_MAP = new Map<string, string>();
for (const g of GENRES) {
  GENRE_MAP.set(g.id.toLowerCase(), g.name);
  GENRE_MAP.set(g.name.toLowerCase(), g.name);
}

/**
 * Chuyển đổi genre id sang genre name (ví dụ: "boylove" -> "Boylove", "mystery" -> "Trinh thám")
 */
export function getGenreName(idOrName: string): string {
  if (!idOrName) return "";
  const trimmed = idOrName.trim();
  return GENRE_MAP.get(trimmed.toLowerCase()) || trimmed;
}

/**
 * Nhận mảng genres (id hoặc name) và trả về chuỗi tên tiếng Việt hiển thị
 */
export function formatGenreNames(genres: unknown): string {
  if (!Array.isArray(genres)) return "";
  return genres
    .filter((g): g is string => typeof g === "string" && Boolean(g.trim()))
    .map(getGenreName)
    .join(", ");
}
