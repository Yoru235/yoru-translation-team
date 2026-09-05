import { NextResponse } from "next/server";
import path from "path";
import { env } from "cloudflare:workers";
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
  const extension = path.extname(fileName).toLowerCase();

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
    const uploadType = formData.get("type");

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
       XÁC ĐỊNH THƯ MỤC R2
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

    /* =====================================================
       ĐỌC FILE
    ===================================================== */

    const bytes = await file.arrayBuffer();

    /* =====================================================
       WATERMARK CHAPTER
    ===================================================== */

    let finalBuffer = new Uint8Array(bytes);

    if (type === "chapter") {
      const imageInfo = await env.IMAGES.info(
        new Response(bytes).body!
      );

      const imageWidth =
        "width" in imageInfo &&
        typeof imageInfo.width === "number"
          ? imageInfo.width
          : 1000;

      const fontSize = Math.max(
        12,
        Math.min(
          18,
          Math.floor(imageWidth * 0.018)
        )
      );

      const line1 = env.IMAGES.text(
        "YORUTEAM.COM ĐỂ ỦNG HỘ NHÓM DỊCH",
        {
          font: {
            url: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
          },
          color: "#000000",
          size: fontSize,
        }
      );

      const line2 = env.IMAGES.text(
        "NẾU VIEW QUÁ ÍT = DROP TRUYỆN",
        {
          font: {
            url: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
          },
          color: "#d71920",
          size: fontSize,
        }
      );

      const transformed = await env.IMAGES
        .input(new Response(bytes).body!)
        .draw(line1, {
          right: 12,
          bottom: 34,
        })
        .draw(line2, {
          right: 12,
          bottom: 12,
        })
        .output({
          format: "image/webp",
          quality: 85,
        });

      const response = transformed.response();

      finalBuffer = new Uint8Array(
        await response.arrayBuffer()
      );
    }

    /* =====================================================
       TẠO TÊN FILE AN TOÀN
    ===================================================== */

    const extension =
      type === "chapter"
        ? ".webp"
        : path.extname(file.name).toLowerCase() ||
          ".jpg";

    const safeFileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${extension}`;

    /* =====================================================
       TẠO KEY TRONG R2
       ===================================================== */

    const objectKey =
      `${folderName}/${safeFileName}`;

    /* =====================================================
       UPLOAD LÊN CLOUDFLARE R2
    ===================================================== */

    await env.UPLOADS.put(
      objectKey,
      finalBuffer,
      {
        httpMetadata: {
          contentType:
            type === "chapter"
              ? "image/webp"
              : file.type || "image/jpeg",
          cacheControl:
            "public, max-age=31536000, immutable",
        },
      }
    );

    /* =====================================================
       URL NỘI BỘ
    ===================================================== */

    const imageUrl =
      `/uploads/${objectKey}`;

    /* =====================================================
       TRẢ KẾT QUẢ
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        type,

        message: "Upload ảnh thành công.",

        imageUrl,

        fileName: file.name,

        images: [
          {
            imageUrl,
            fileName: file.name,
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
        error: "Không thể upload ảnh.",
      },
      { status: 500 }
    );
  }
}