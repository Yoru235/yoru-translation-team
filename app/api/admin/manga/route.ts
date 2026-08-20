import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    // ==========================================
    // NẾU CÓ ID → LẤY CHI TIẾT 1 TRUYỆN
    // ==========================================

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

    // ==========================================
    // KHÔNG CÓ ID → LẤY DANH SÁCH TRUYỆN
    // ==========================================

    const mangas = await prisma.manga.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        type: true,
        status: true,
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

    const updatedManga = await prisma.manga.update({
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

            
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : manga.description,

            author:
  typeof body.author === "string"
    ? body.author.trim() || null
    : manga.author,
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

  return NextResponse.json(
    {
      success: false,
      error: String(error),
    },
    { status: 500 }
  );
}
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body.title ||
      typeof body.title !== "string" ||
      !body.title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên truyện không được để trống.",
        },
        { status: 400 }
      );
    }

    const manga = await prisma.manga.create({
      data: {
        title: body.title.trim(),
        author:
    typeof body.author === "string"
      ? body.author.trim() || null
      : null,

        originalTitle:
          typeof body.originalTitle === "string"
            ? body.originalTitle.trim() || null
            : null,

        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : null,

        type:
          typeof body.type === "string"
            ? body.type
            : "Manga",

        status:
          typeof body.status === "string"
            ? body.status
            : "ongoing",

        genres:
          Array.isArray(body.genres)
            ? body.genres.filter(
                (genre: unknown) =>
                  typeof genre === "string"
              )
            : [],

        ageRestricted:
          typeof body.ageRestricted === "boolean"
            ? body.ageRestricted
            : false,

        coverUrl:
          typeof body.coverUrl === "string"
            ? body.coverUrl.trim() || null
            : null,

        creditUrl:
          typeof body.creditUrl === "string"
            ? body.creditUrl.trim() || null
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      manga,
    });
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

export async function DELETE(request: Request) {
  try {
    // ==========================================
    // LẤY ID TỪ BODY HOẶC QUERY
    // ==========================================

    let body: { id?: unknown } = {};

    try {
      body = await request.json();
    } catch {
      // Không có body thì vẫn tiếp tục,
      // thử lấy id từ query.
    }

    const { searchParams } = new URL(request.url);

    const queryId = searchParams.get("id");

    const bodyId =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    const id = bodyId || queryId?.trim() || "";

    // ==========================================
    // KIỂM TRA ID
    // ==========================================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID truyện cần xóa.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // KIỂM TRA TRUYỆN CÓ TỒN TẠI KHÔNG
    // ==========================================

    const manga = await prisma.manga.findUnique({
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

    // ==========================================
    // XÓA TRUYỆN
    //
    // Schema Prisma của bạn đã có:
    //
    // Chapter     -> onDelete: Cascade
    // ChapterImage -> onDelete: Cascade
    // MangaView   -> onDelete: Cascade
    //
    // Vì vậy khi xóa Manga, dữ liệu liên quan
    // sẽ được PostgreSQL xóa theo.
    // ==========================================

    await prisma.$transaction(async (tx) => {
      await tx.manga.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa truyện "${manga.title}".`,
    });
  } catch (error) {
    console.error("DELETE MANGA ERROR:", error);

    // Lấy thông tin lỗi thật để dễ sửa
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