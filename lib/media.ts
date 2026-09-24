export const R2_PUBLIC_DOMAIN = (
  (typeof process !== "undefined" &&
    (process.env?.NEXT_PUBLIC_R2_PUBLIC_DOMAIN ||
      process.env?.R2_PUBLIC_DOMAIN)) ||
  "https://img.yoruteam.com"
).replace(/\/+$/, "");

/**
 * Chuyển đổi đường dẫn ảnh nội bộ (dạng /uploads/..., uploads/..., covers/..., v.v.) 
 * sang URL công khai tải trực tiếp từ CDN R2 (https://img.yoruteam.com/...)
 * Giúp trình duyệt tải ảnh trực tiếp từ R2 mà không cần đi qua Worker.
 */
export function toMediaUrl(url?: string | null): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Nếu là URL tuyệt đối bên ngoài (http:// hoặc https://)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Chuẩn hóa loại bỏ /uploads/ hoặc uploads/ hoặc dấu gạch chéo đầu dòng
  const cleanPath = trimmed
    .replace(/^\/?uploads\//, "")
    .replace(/^\/+/, "");

  if (!cleanPath) return "";

  return `${R2_PUBLIC_DOMAIN}/${cleanPath}`;
}

