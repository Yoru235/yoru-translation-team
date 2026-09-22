import { env } from "cloudflare:workers";
import { prisma } from "./prisma";

/**
 * Thực thi câu lệnh SQL thô trực tiếp trên Cloudflare D1 mà không qua Prisma engine.
 * Giúp tối ưu tốc độ tối đa và giảm thiểu tài nguyên CPU của Worker.
 */
export async function rawQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    if (typeof env !== "undefined" && (env as any)?.yoru_database) {
      const stmt = (env as any).yoru_database.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      const res = await bound.all();
      return (res.results as T[]) || [];
    }
  } catch (error) {
    console.warn("D1 native query fallback to Prisma:", error);
  }

  // Fallback nếu không có D1 native binding
  try {
    return (await prisma.$queryRawUnsafe<T[]>(sql, ...params)) || [];
  } catch (err) {
    console.error("Database query error:", err);
    return [];
  }
}
