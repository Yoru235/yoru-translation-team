import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createUnlockToken } from "@/lib/auth/unlock-token";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // ==========================================
    // KIỂM TRA ĐĂNG NHẬP
    // ==========================================

    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse(
        "Bạn cần đăng nhập.",
        { status: 401 }
      );
    }

    // ==========================================
    // LẤY ID ẢNH
    // ==========================================

    const { id } = await context.params;

    if (!id) {
      return new NextResponse(
        "Thiếu ID ảnh.",
        { status: 400 }
      );
    }

    // ==========================================
    // TÌM ẢNH TRONG DATABASE
    // ==========================================

    const image =
  await prisma.chapterImage.findUnique({
    where: {
      id,
    },
    include: {
  chapter: {
    select: {
      isLocked: true,
      passwordHash: true,
      mangaId: true,
      manga: {
        select: {
          isLocked: true,
          passwordHash: true,
        },
      },
    },
  },
},
  });

    if (!image) {
      return new NextResponse(
        "Không tìm thấy ảnh.",
        { status: 404 }
      );
    }
    const cookieStore = await cookies();

if (image.chapter.manga.isLocked) {
  const mangaUnlockCookie = cookieStore.get(
    `manga-unlocked-${image.chapter.mangaId}`
  );

  const mangaUnlocked =
    !!image.chapter.manga.passwordHash &&
    mangaUnlockCookie?.value ===
      createUnlockToken(image.chapter.manga.passwordHash);

  if (!mangaUnlocked) {
    return new NextResponse(
      "Truyện chưa được mở khóa.",
      { status: 403 }
    );
  }
}

if (image.chapter.isLocked) {
  const chapterUnlockCookie = cookieStore.get(
    `chapter-unlocked-${image.chapterId}`
  );

  const chapterUnlocked =
    !!image.chapter.passwordHash &&
    chapterUnlockCookie?.value ===
      createUnlockToken(image.chapter.passwordHash);

  if (!chapterUnlocked) {
    return new NextResponse(
      "Chapter chưa được mở khóa.",
      { status: 403 }
    );
  }
}
    // ==========================================
    // CHỈ CHO PHÉP ẢNH TRONG /uploads/
    // ==========================================

    if (
      !image.imageUrl.startsWith(
        "/uploads/"
      )
    ) {
      return new NextResponse(
        "Đường dẫn ảnh không hợp lệ.",
        { status: 400 }
      );
    }

    // ==========================================
// TẠO ĐƯỜNG DẪN FILE
// ==========================================

const relativePath =
  image.imageUrl.replace(/^\/+/, "");

const uploadsDirectory =
  path.resolve(
    process.cwd(),
    "public",
    "uploads"
  );

const privateChaptersDirectory =
  path.resolve(
    process.cwd(),
    ".data",
    "uploads",
    "chapters"
  );

let filePath: string;

// Chapter images mới nằm trong .data
if (
  relativePath.startsWith("uploads/chapters/")
) {
  const fileName =
    relativePath.replace(
      "uploads/chapters/",
      ""
    );

  filePath = path.resolve(
    privateChaptersDirectory,
    fileName
  );

  // Không cho phép thoát khỏi thư mục private
  if (
    filePath !== privateChaptersDirectory &&
    !filePath.startsWith(
      privateChaptersDirectory + path.sep
    )
  ) {
    return new NextResponse(
      "Đường dẫn ảnh không hợp lệ.",
      { status: 400 }
    );
  }
} else {
  // Cover / credit / avatar vẫn dùng public/uploads
  filePath = path.resolve(
    process.cwd(),
    "public",
    relativePath
  );

  // Không cho phép thoát khỏi /public/uploads
  if (
    filePath !== uploadsDirectory &&
    !filePath.startsWith(
      uploadsDirectory + path.sep
    )
  ) {
    return new NextResponse(
      "Đường dẫn ảnh không hợp lệ.",
      { status: 400 }
    );
  }
}
    // ==========================================
    // ĐỌC FILE
    // ==========================================

    const fileBuffer =
      await readFile(filePath);

    // ==========================================
    // XÁC ĐỊNH CONTENT TYPE
    // ==========================================

    const extension =
      path.extname(filePath)
        .toLowerCase();

    const contentTypes: Record<
      string,
      string
    > = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
    };

    const contentType =
      contentTypes[extension] ||
      "application/octet-stream";

    // ==========================================
    // TRẢ ẢNH
    // ==========================================

    return new NextResponse(
      fileBuffer,
      {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "private, no-store, max-age=0",
          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET PROTECTED IMAGE ERROR:",
      error
    );

    return new NextResponse(
      "Không thể tải ảnh.",
      { status: 500 }
    );
  }
}