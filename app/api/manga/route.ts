import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET
   - Có ?id=...  → lấy chi tiết 1 truyện
   - Không có id → lấy danh sách truyện
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    /* =========================
       LẤY CHI TIẾT 1 TRUYỆN
    ========================= */

    if (id) {
      const manga = await prisma.manga.findUnique({
        where: {
          id,
        },
        include: {
          chapters: {
            select: {
              id: true,
              chapter: true,
              volume: true,
            },
            orderBy: {
              chapter: "asc",
            },
          },
        },
      });

      if (!manga) {
        return NextResponse.json(
          {
            success: false,
            error: "Không tìm thấy truyện.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        manga,
      });
    }

    /* =========================
       LẤY DANH SÁCH TRUYỆN
    ========================= */

    const mangas = await prisma.manga.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        chapters: {
          select: {
            id: true,
            chapter: true,
            volume: true,
          },
          orderBy: {
            chapter: "desc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      mangas,
    });
  } catch (error) {
    console.error("GET MANGA ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách truyện.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   - TẠO TRUYỆN MỚI
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập tên truyện.",
        },
        { status: 400 }
      );
    }

    const originalTitle =
      typeof body.originalTitle === "string"
        ? body.originalTitle.trim() || null
        : null;

    const description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;

    const type =
      typeof body.type === "string"
        ? body.type
        : "Manga";

    const status =
      typeof body.status === "string"
        ? body.status
        : "ongoing";

    const ageRestricted =
      typeof body.ageRestricted === "boolean"
        ? body.ageRestricted
        : false;

    const genres = Array.isArray(body.genres)
      ? body.genres.filter(
          (genre: unknown) =>
            typeof genre === "string"
        )
      : [];

    const coverUrl =
      typeof body.coverUrl === "string"
        ? body.coverUrl.trim() || null
        : null;

    const creditUrl =
      typeof body.creditUrl === "string"
        ? body.creditUrl.trim() || null
        : null;

    /* =========================
       TẠO TRUYỆN
    ========================= */

    const manga = await prisma.manga.create({
      data: {
        title,
        originalTitle,
        description,
        type,
        status,
        ageRestricted,
        genres,
        coverUrl,
        creditUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tạo truyện thành công.",
        manga,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE MANGA ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo truyện.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   - SỬA THÔNG TIN TRUYỆN
========================================================= */

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = body?.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID truyện.",
        },
        { status: 400 }
      );
    }

    /* =========================
       KIỂM TRA TRUYỆN
    ========================= */

    const existingManga =
      await prisma.manga.findUnique({
        where: {
          id,
        },
      });

    if (!existingManga) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy truyện.",
        },
        { status: 404 }
      );
    }

    /* =========================
       CẬP NHẬT
    ========================= */

    const updatedManga =
      await prisma.manga.update({
        where: {
          id,
        },
        data: {
          title:
            typeof body.title === "string"
              ? body.title.trim()
              : existingManga.title,

          originalTitle:
            typeof body.originalTitle ===
            "string"
              ? body.originalTitle.trim() ||
                null
              : existingManga.originalTitle,

          description:
            typeof body.description ===
            "string"
              ? body.description.trim() ||
                null
              : existingManga.description,

          type:
            typeof body.type === "string"
              ? body.type
              : existingManga.type,

          status:
            typeof body.status === "string"
              ? body.status
              : existingManga.status,

          ageRestricted:
            typeof body.ageRestricted ===
            "boolean"
              ? body.ageRestricted
              : existingManga.ageRestricted,

          coverUrl:
            typeof body.coverUrl === "string"
              ? body.coverUrl.trim() || null
              : existingManga.coverUrl,

          creditUrl:
            typeof body.creditUrl === "string"
              ? body.creditUrl.trim() || null
              : existingManga.creditUrl,

          genres:
            Array.isArray(body.genres)
              ? body.genres.filter(
                  (genre: unknown) =>
                    typeof genre === "string"
                )
              : existingManga.genres,
        },
      });

    return NextResponse.json({
      success: true,
      manga: updatedManga,
    });
  } catch (error) {
    console.error(
      "UPDATE MANGA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật truyện.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   - XÓA TRUYỆN
========================================================= */

export async function DELETE(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const mangaId =
      searchParams.get("id");

    if (!mangaId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID truyện.",
        },
        { status: 400 }
      );
    }

    /* =========================
       KIỂM TRA TRUYỆN
    ========================= */

    const existingManga =
      await prisma.manga.findUnique({
        where: {
          id: mangaId,
        },
      });

    if (!existingManga) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy truyện.",
        },
        { status: 404 }
      );
    }

    /* =========================
       XÓA TRUYỆN
    ========================= */

    await prisma.manga.delete({
      where: {
        id: mangaId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa truyện thành công.",
    });
  } catch (error) {
    console.error(
      "DELETE MANGA ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Không thể xóa truyện.",
      },
      { status: 500 }
    );
  }
}