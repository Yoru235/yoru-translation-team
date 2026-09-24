import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";

export async function GET() {
  try {
    const rawMangas = await rawQuery<{
      id: string;
      title: string;
      coverUrl: string | null;
      type: string;
      status: string;
      views: number;
      updatedAt: string | number | Date;
    }>(`
      SELECT 
        m.id, 
        m.title, 
        m.coverUrl, 
        m.type, 
        m.status, 
        m.views, 
        COALESCE(
          (SELECT MAX(c.createdAt) FROM Chapter c WHERE c.mangaId = m.id),
          m.updatedAt,
          m.createdAt
        ) AS updatedAt
      FROM Manga m
      ORDER BY updatedAt DESC
    `);

    const mangas = (rawMangas || []).map((m) => {
      const effectiveUpdatedAt = m.updatedAt
        ? new Date(m.updatedAt).toISOString()
        : new Date().toISOString();

      return {
        id: m.id,
        title: m.title,
        coverUrl: m.coverUrl || null,
        type: m.type || "Manga",
        status: m.status || "ongoing",
        views: Number(m.views) || 0,
        createdAt: effectiveUpdatedAt,
        updatedAt: effectiveUpdatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      mangas,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách manga qua raw SQL:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy danh sách truyện",
      },
      {
        status: 500,
      }
    );
  }
}