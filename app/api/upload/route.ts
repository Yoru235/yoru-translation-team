import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
];

function isImageFile(fileName: string) {
  const extension =
    path.extname(fileName).toLowerCase();

  return IMAGE_EXTENSIONS.includes(extension);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    /*
      type:
      - chapter
      - cover
      - credit

      Nếu không gửi type → mặc định chapter
      để không làm hỏng upload chapter hiện tại.
    */

    const uploadType =
      formData.get("type");

    const type =
      uploadType === "cover" ||
      uploadType === "credit"
        ? uploadType
        : "chapter";

    /* =====================================================
       KIỂM TRA FILE
    ===================================================== */

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy file.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       KIỂM TRA ẢNH
    ===================================================== */

    if (
      !file.type.startsWith("image/") &&
      !isImageFile(file.name)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "File tải lên phải là ảnh.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       XÁC ĐỊNH THƯ MỤC
    ===================================================== */

    let folderName: string;

    switch (type) {
      case "cover":
        folderName = "covers";
        break;

      case "credit":
        folderName = "credits";
        break;

      case "chapter":
      default:
        folderName = "chapters";
        break;
    }

    const uploadDirectory =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        folderName
      );

    await mkdir(
      uploadDirectory,
      {
        recursive: true,
      }
    );

    /* =====================================================
       ĐỌC FILE
    ===================================================== */

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    /* =====================================================
       TẠO TÊN FILE AN TOÀN
    ===================================================== */

    const extension =
      path.extname(
        file.name
      ).toLowerCase() || ".jpg";

    const safeFileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${extension}`;

    const filePath =
      path.join(
        uploadDirectory,
        safeFileName
      );

    /* =====================================================
       LƯU FILE
    ===================================================== */

    await writeFile(
      filePath,
      buffer
    );

    /* =====================================================
       TẠO URL
    ===================================================== */

    const imageUrl =
      `/uploads/${folderName}/${safeFileName}`;

    /* =====================================================
       TRẢ KẾT QUẢ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        type,

        message:
          "Upload ảnh thành công.",

        imageUrl,

        fileName:
          file.name,

        images: [
          {
            imageUrl,
            fileName:
              file.name,
            order: 1,
          },
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "UPLOAD IMAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Không thể upload ảnh.",
      },
      { status: 500 }
    );
  }
}