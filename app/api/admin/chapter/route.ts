import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mangaId = searchParams.get("mangaId");
    const chapterId =
      searchParams.get("chapterId") ||
      searchParams.get("id");

    // ==========================================
    // KIỂM TRA THAM SỐ
    // ==========================================

    if (!mangaId && !chapterId) {
      return NextResponse.json(
        {
          error: "Thiếu mangaId hoặc chapterId.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // LẤY CHAPTER THEO CHAPTER ID
    // ==========================================

    if (chapterId) {
      const chapter =
        await prisma.chapter.findUnique({
          where: {
            id: chapterId,
          },
          include: {
            images: {
              orderBy: {
                order: "asc",
              },
            },
            manga: {
              select: {
                id: true,
                title: true,
                coverUrl: true,
                type: true,
                creditUrl: true,
                isLocked: true,
                passwordHint: true,
  
              },
            },
          },
        });

      if (!chapter) {
        return NextResponse.json(
          {
            error: "Không tìm thấy chapter.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        chapter,
      });
    }

    // ==========================================
    // LẤY DANH SÁCH CHAPTER CỦA TRUYỆN
    // ==========================================

    const chapters =
      await prisma.chapter.findMany({
        where: {
          mangaId: mangaId!,
        },
        orderBy: {
          chapter: "asc",
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      chapters,
    });
  } catch (error) {
    console.error(
      "GET CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể tải chapter.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      mangaId,
      volume,
      chapter,
      images,
    } = body;

    // ================================
    // KIỂM TRA TRUYỆN
    // ================================

    if (!mangaId) {
      return NextResponse.json(
        {
          error: "Chưa chọn truyện.",
        },
        { status: 400 }
      );
    }

    // ================================
    // KIỂM TRA CHAPTER
    // ================================

    if (
      chapter === undefined ||
      chapter === null ||
      chapter === ""
    ) {
      return NextResponse.json(
        {
          error: "Chưa nhập số chapter.",
        },
        { status: 400 }
      );
    }

    const chapterNumber = Number(chapter);

    if (
      Number.isNaN(chapterNumber) ||
      chapterNumber < 0
    ) {
      return NextResponse.json(
        {
          error: "Số chapter không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // ================================
    // KIỂM TRA ẢNH
    // ================================

    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Chapter chưa có ảnh.",
        },
        { status: 400 }
      );
    }

    // ================================
    // KIỂM TRA TRUYỆN CÓ TỒN TẠI
    // ================================

    /*
      QUAN TRỌNG:
      Lấy luôn creditUrl của truyện.

      Credit được lưu ở Manga nên mỗi chapter
      chỉ cần lấy Manga theo mangaId là biết
      phải dùng credit nào.
    */

    const manga =
      await prisma.manga.findUnique({
        where: {
          id: mangaId,
        },
        select: {
          id: true,
          title: true,
          creditUrl: true,
        },
      });

    if (!manga) {
      return NextResponse.json(
        {
          error: "Không tìm thấy truyện.",
        },
        { status: 404 }
      );
    }

    // ================================
    // KIỂM TRA VOLUME
    // ================================

    let volumeNumber: number | null = null;

    if (
      volume !== undefined &&
      volume !== null &&
      volume !== ""
    ) {
      const parsedVolume = Number(volume);

      if (
        Number.isNaN(parsedVolume) ||
        parsedVolume < 1
      ) {
        return NextResponse.json(
          {
            error: "Số volume không hợp lệ.",
          },
          { status: 400 }
        );
      }

      volumeNumber = parsedVolume;
    }

    // ================================
    // KIỂM TRA VÀ CHUẨN HÓA ẢNH
    // ================================

    const validImages: {
      imageUrl: string;
      fileName: string;
      order: number;
    }[] = [];

    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      const image = images[index];

      if (
        typeof image !== "object" ||
        image === null
      ) {
        continue;
      }

      const imageUrl =
        "imageUrl" in image &&
        typeof image.imageUrl === "string"
          ? image.imageUrl
          : undefined;

      const fileName =
        "fileName" in image &&
        typeof image.fileName === "string"
          ? image.fileName
          : undefined;

      const imageOrder =
        "order" in image &&
        typeof image.order === "number"
          ? image.order
          : index + 1;

      if (!imageUrl || !fileName) {
        continue;
      }

      validImages.push({
        imageUrl,
        fileName,
        order: imageOrder,
      });
    }

    // ================================
    // KIỂM TRA ẢNH HỢP LỆ
    // ================================

    if (validImages.length === 0) {
      return NextResponse.json(
        {
          error: "Không có ảnh hợp lệ.",
        },
        { status: 400 }
      );
    }

    // ================================
    // SẮP XẾP ẢNH THEO ORDER
    // ================================

    validImages.sort(
      (a, b) => a.order - b.order
    );

    // ================================
    // THÊM CREDIT VÀO CUỐI CHAPTER
    // ================================

    /*
      Nếu truyện có credit:
      - Không cần upload lại credit.
      - Không cần chọn credit khi upload chapter.
      - Lấy trực tiếp creditUrl đã lưu trong Manga.
      - Credit luôn nằm SAU CÙNG tất cả ảnh chapter.
    */

    if (manga.creditUrl) {
      const lastOrder =
        validImages.length > 0
          ? Math.max(
              ...validImages.map(
                (image) => image.order
              )
            )
          : 0;

      validImages.push({
        imageUrl: manga.creditUrl,
        fileName: "credit-re.jpg",
        order: lastOrder + 1,
      });
    }

    // ================================
    // TẠO CHAPTER + ẢNH
    // ================================

    const newChapter =
      await prisma.chapter.create({
        data: {
          mangaId: manga.id,

          volume: volumeNumber,

          chapter: chapterNumber,

          images: {
            create: validImages.map(
              (image) => ({
                imageUrl: image.imageUrl,
                fileName: image.fileName,
                order: image.order,
              })
            ),
          },
        },

        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

    // ================================
    // TRẢ KẾT QUẢ
    // ================================

    return NextResponse.json(
      {
        success: true,

        message:
          manga.creditUrl
            ? "Upload chapter thành công và đã tự động thêm credit của truyện."
            : "Upload chapter thành công.",

        chapter: newChapter,

        manga,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "UPLOAD CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Không thể upload chapter.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const chapterId =
      searchParams.get("id") ||
      searchParams.get("chapterId");

    // ==========================================
    // KIỂM TRA ID
    // ==========================================

    if (!chapterId) {
      return NextResponse.json(
        {
          error: "Thiếu ID chapter.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // ĐỌC DỮ LIỆU
    // ==========================================

    const body = await request.json();

    const {
      chapter,
      volume,
    } = body;

    // ==========================================
    // KIỂM TRA CHAPTER
    // ==========================================

    if (
      chapter === undefined ||
      chapter === null ||
      chapter === ""
    ) {
      return NextResponse.json(
        {
          error: "Chưa nhập số chapter.",
        },
        { status: 400 }
      );
    }

    const chapterNumber = Number(chapter);

    if (
      !Number.isFinite(chapterNumber) ||
      chapterNumber < 0
    ) {
      return NextResponse.json(
        {
          error: "Số chapter không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // KIỂM TRA VOLUME
    // ==========================================

    let volumeNumber: number | null = null;

    if (
      volume !== undefined &&
      volume !== null &&
      volume !== ""
    ) {
      const parsedVolume = Number(volume);

      if (
        !Number.isFinite(parsedVolume) ||
        parsedVolume < 0
      ) {
        return NextResponse.json(
          {
            error: "Số volume không hợp lệ.",
          },
          { status: 400 }
        );
      }

      volumeNumber = parsedVolume;
    }

    // ==========================================
    // KIỂM TRA CHAPTER CÓ TỒN TẠI
    // ==========================================

    const existingChapter =
      await prisma.chapter.findUnique({
        where: {
          id: chapterId,
        },
      });

    if (!existingChapter) {
      return NextResponse.json(
        {
          error: "Không tìm thấy chapter.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // CẬP NHẬT CHAPTER
    // ==========================================

    const updatedChapter =
      await prisma.chapter.update({
        where: {
          id: chapterId,
        },
        data: {
          chapter: chapterNumber,
          volume: volumeNumber,
        },
      });

    // ==========================================
    // TRẢ KẾT QUẢ
    // ==========================================

    return NextResponse.json({
      success: true,
      message:
        "Đã cập nhật chapter thành công.",
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error(
      "UPDATE CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Không thể cập nhật chapter.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// XÓA CHAPTER
// ==========================================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const chapterId =
      searchParams.get("id") ||
      searchParams.get("chapterId");

    // ==========================================
    // KIỂM TRA ID
    // ==========================================

    if (!chapterId) {
      return NextResponse.json(
        {
          error: "Thiếu ID chapter.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // KIỂM TRA CHAPTER CÓ TỒN TẠI
    // ==========================================

    const existingChapter =
      await prisma.chapter.findUnique({
        where: {
          id: chapterId,
        },
      });

    if (!existingChapter) {
      return NextResponse.json(
        {
          error: "Không tìm thấy chapter.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // XÓA ẢNH CỦA CHAPTER
    // ==========================================

    await prisma.chapterImage.deleteMany({
      where: {
        chapterId: chapterId,
      },
    });

    // ==========================================
    // XÓA CHAPTER
    // ==========================================

    await prisma.chapter.delete({
      where: {
        id: chapterId,
      },
    });

    // ==========================================
    // TRẢ KẾT QUẢ
    // ==========================================

    return NextResponse.json({
      success: true,
      message: "Đã xóa chapter thành công.",
      chapterId,
    });
  } catch (error) {
    console.error(
      "DELETE CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể xóa chapter.",
      },
      { status: 500 }
    );
  }
}