import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth/session";

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
        const user = await getCurrentUser();
        console.log("UPLOAD USER:", user);

    if (
      !user ||
      !["OWNER", "ADMIN", "EDITOR"].includes(user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn không có quyền upload ảnh.",
        },
        { status: 403 }
      );
    }
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
  uploadType === "credit" ||
  uploadType === "avatar"
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

  case "avatar":
    folderName = "avatars";
    break;

  case "chapter":
  default:
    folderName = "chapters";
    break;
}

   const uploadDirectory =
  type === "chapter"
    ? path.join(
        process.cwd(),
        ".data",
        "uploads",
        "chapters"
      )
    : path.join(
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
   WATERMARK CHAPTER
   ===================================================== */

let finalBuffer = buffer;

if (type === "chapter") {
  const imageMetadata = await sharp(buffer).metadata();

  const imageWidth = imageMetadata.width || 1000;
  const imageHeight = imageMetadata.height || 1000;

  // Watermark nhỏ, nằm ở góc phải dưới
  const watermarkWidth = Math.min(
    Math.max(Math.floor(imageWidth * 0.42), 220),
    520
  );

  const watermarkHeight = Math.min(
    48,
    Math.max(Math.floor(imageHeight * 0.06), 36)
  );

  const fontSize = Math.max(
    12,
    Math.min(
      18,
      Math.floor(watermarkWidth * 0.033)
    )
  );

  const watermark = Buffer.from(`
    <svg
      width="${watermarkWidth}"
      height="${watermarkHeight}"
      viewBox="0 0 ${watermarkWidth} ${watermarkHeight}"
    >
      <style>
        .line1 {
          fill: #000000;
          stroke: #ffffff;
          stroke-width: 0.8px;
          paint-order: stroke fill;
          font-size: ${fontSize}px;
          font-family: Arial Narrow, Arial, sans-serif;
          font-weight: 800;
        }

        .line2 {
          fill: #d71920;
          stroke: #ffffff;
          stroke-width: 0.8px;
          paint-order: stroke fill;
          font-size: ${fontSize}px;
          font-family: Arial Narrow, Arial, sans-serif;
          font-weight: 800;
        }
      </style>

      <text
        x="${watermarkWidth - 4}"
        y="${fontSize}"
        text-anchor="end"
        class="line1"
      >
        YORUTEAM.COM ĐỂ ỦNG HỘ NHÓM DỊCH
      </text>

      <text
        x="${watermarkWidth - 4}"
        y="${fontSize * 2}"
        text-anchor="end"
        class="line2"
      >
        NẾU VIEW QUÁ ÍT = DROP TRUYỆN
      </text>
    </svg>
  `);

  finalBuffer = await sharp(buffer)
    .composite([
      {
        input: watermark,
        gravity: "southeast",
      },
    ])
    .toBuffer();
}
/* =====================================================
   LƯU FILE
   ===================================================== */

await writeFile(
  filePath,
  finalBuffer
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