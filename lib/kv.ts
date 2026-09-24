import { env } from "cloudflare:workers";

/**
 * In-memory fallback map cho môi trường local/dev
 * nếu binding Cloudflare KV chưa được khởi tạo.
 */
const localKvFallback = new Map<string, { value: string; expiresAt: number }>();

function getKvBinding(): any | null {
  try {
    if (
      typeof env !== "undefined" &&
      (env as any)?.KV_AUTH &&
      typeof (env as any).KV_AUTH.get === "function"
    ) {
      return (env as any).KV_AUTH;
    }
  } catch {
    // Không có binding hoặc đang chạy môi trường test/local
  }
  return null;
}

/**
 * Thực thi Promise với timeout an toàn
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = 500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("KV operation timed out")), ms)
    ),
  ]);
}

/**
 * Lấy giá trị từ KV theo key
 */
export async function kvGet(key: string): Promise<string | null> {
  const kv = getKvBinding();
  if (kv) {
    try {
      return await withTimeout(kv.get(key), 500);
    } catch {
      // Fallback xuống memory khi local dev chưa sync remote KV
    }
  }

  const item = localKvFallback.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    localKvFallback.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Lưu giá trị vào KV với thời gian hết hạn (expirationTtl tính theo giây)
 */
export async function kvSet(
  key: string,
  value: string,
  options?: { expirationTtl?: number }
): Promise<void> {
  const ttl = options?.expirationTtl || 300; // Mặc định 5 phút (300 giây)
  const kv = getKvBinding();

  if (kv) {
    try {
      await withTimeout(
        kv.put(key, value, {
          expirationTtl: ttl,
        }),
        500
      );
      return;
    } catch {
      // Fallback xuống memory khi local dev chưa sync remote KV
    }
  }

  localKvFallback.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * Xóa key khỏi KV
 */
export async function kvDelete(key: string): Promise<void> {
  const kv = getKvBinding();
  if (kv) {
    try {
      await withTimeout(kv.delete(key), 500);
      return;
    } catch {
      // Fallback xuống memory
    }
  }

  localKvFallback.delete(key);
}
