import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   HÀM XỬ LÝ NGÀY
========================================================= */

function parseReleaseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* =========================================================
   GET
   - Có ?id=... → lấy chi tiết 1 truyện
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
              isLocked: true,
              passwordHint: true,
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

      select: {
        id: true,
        title: true,
        originalTitle: true,
        author: true,
        releaseDate: true,
        description: true,
        type: true,
        status: true,
        ageRestricted: true,
        coverUrl: true,
        creditUrl: true,
        translationGroupId: true,

translationGroup: {
  select: {
    id: true,
    name: true,
    slug: true,
    avatar: true,
  },
},
        views: true,
        genres: true,
        isLocked: true,
        passwordHint: true,

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

    /* =========================
       KIỂM TRA TÊN TRUYỆN
    ========================= */

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên truyện không được để trống.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CHUẨN BỊ DỮ LIỆU
    ========================= */

    const originalTitle =
      typeof body.originalTitle === "string"
        ? body.originalTitle.trim() || null
        : null;

    const author =
      typeof body.author === "string"
        ? body.author.trim() || null
        : null;

    const releaseDate = parseReleaseDate(
      body.releaseDate
    );

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

    const translationGroupId =
  typeof body.translationGroupId === "string"
    ? body.translationGroupId.trim() || null
    : null;

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
        author,
        releaseDate,
        description,
        type,
        status,
        ageRestricted,
translationGroupId,
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

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Không thể tạo truyện: ${errorMessage}`
            : "Không thể tạo truyện.",
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

    const manga = await prisma.manga.findUnique({
      where: {
        id,
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
              : manga.title,

          originalTitle:
            typeof body.originalTitle === "string"
              ? body.originalTitle.trim() || null
              : manga.originalTitle,

          author:
            typeof body.author === "string"
              ? body.author.trim() || null
              : manga.author,

          releaseDate:
            body.releaseDate !== undefined
              ? parseReleaseDate(
                  body.releaseDate
                )
              : manga.releaseDate,

          description:
            typeof body.description === "string"
              ? body.description.trim() || null
              : manga.description,

          type:
            typeof body.type === "string"
              ? body.type
              : manga.type,

          status:
            typeof body.status === "string"
              ? body.status
              : manga.status,

          ageRestricted:
            typeof body.ageRestricted === "boolean"
              ? body.ageRestricted
              : manga.ageRestricted,

          translationGroupId:
  body.translationGroupId !== undefined
    ? typeof body.translationGroupId === "string"
      ? body.translationGroupId.trim() || null
      : null
    : manga.translationGroupId,

          coverUrl:
            typeof body.coverUrl === "string"
              ? body.coverUrl.trim() || null
              : manga.coverUrl,

          creditUrl:
            typeof body.creditUrl === "string"
              ? body.creditUrl.trim() || null
              : manga.creditUrl,

          genres:
            Array.isArray(body.genres)
              ? body.genres.filter(
                  (genre: unknown) =>
                    typeof genre === "string"
                )
              : manga.genres,
        },
      });

    return NextResponse.json({
      success: true,
      manga: updatedManga,
    });
  } catch (error) {
    console.error("UPDATE MANGA ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Không thể cập nhật truyện: ${errorMessage}`
            : "Không thể cập nhật truyện.",
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
    let body: { id?: unknown } = {};

    try {
      body = await request.json();
    } catch {
      // Không có body thì lấy ID từ query
    }

    const { searchParams } =
      new URL(request.url);

    const queryId =
      searchParams.get("id");

    const bodyId =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    const id =
      bodyId ||
      queryId?.trim() ||
      "";

    /* =========================
       KIỂM TRA ID
    ========================= */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID truyện cần xóa.",
        },
        { status: 400 }
      );
    }

    /* =========================
       KIỂM TRA TRUYỆN
    ========================= */

    const manga =
      await prisma.manga.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (!manga) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy truyện cần xóa.",
        },
        { status: 404 }
      );
    }

    /* =========================
       XÓA TRUYỆN
    ========================= */

    await prisma.$transaction(
      async (tx) => {
        await tx.manga.delete({
          where: {
            id,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      message: `Đã xóa truyện "${manga.title}".`,
    });
  } catch (error) {
    console.error("DELETE MANGA ERROR:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Không thể xóa truyện: ${errorMessage}`
            : "Không thể xóa truyện.",
      },
      { status: 500 }
    );
  }
}