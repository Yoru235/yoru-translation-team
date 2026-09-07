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
  const extension = path
    .extname(fileName)
    .toLowerCase();

  return IMAGE_EXTENSIONS.includes(extension);
}

export async function POST(
  request: Request
) {
  try {
    // ================================
    // KIỂM TRA NGƯỜI DÙNG
    // ================================

    const user =
      await getCurrentUser();

    console.log(
      "UPLOAD USER:",
      user
    );

    if (
      !user ||
      !["OWNER", "ADMIN", "EDITOR"].includes(
        user.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bạn không có quyền upload ảnh.",
        },
        {
          status: 403,
        }
      );
    }

    // ================================
    // LẤY FORM DATA
    // ================================

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const uploadType =
      formData.get("type");

    // ================================
    // XÁC ĐỊNH LOẠI UPLOAD
    // ================================

    const type =
      uploadType === "cover" ||
      uploadType === "credit" ||
      uploadType === "avatar"
        ? uploadType
        : "chapter";

    // ================================
    // KIỂM TRA FILE
    // ================================

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không tìm thấy file.",
        },
        {
          status: 400,
        }
      );
    }

    // ================================
    // KIỂM TRA FILE ẢNH
    // ================================

    if (
      !file.type.startsWith(
        "image/"
      ) &&
      !isImageFile(
        file.name
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "File tải lên phải là ảnh.",
        },
        {
          status: 400,
        }
      );
    }

    // ================================
    // KIỂM TRA KÍCH THƯỚC FILE
    // ================================

    const fileSizeMB =
      file.size /
      1024 /
      1024;

    console.log(
      "FILE INFO:",
      {
        name:
          file.name,

        type:
          file.type,

        size:
          file.size,

        sizeMB:
          fileSizeMB.toFixed(2),
      }
    );

    // ================================
    // CHỌN THƯ MỤC R2
    // ================================

    let folderName:
      string;

    switch (type) {
      case "cover":
        folderName =
          "covers";
        break;

      case "credit":
        folderName =
          "credits";
        break;

      case "avatar":
        folderName =
          "avatars";
        break;

      case "chapter":
      default:
        folderName =
          "chapters";
        break;
    }

    // ================================
    // TẠO TÊN FILE
    // ================================

    const extension =
      path
        .extname(
          file.name
        )
        .toLowerCase() ||
      ".jpg";

    const safeFileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}${extension}`;

    // ================================
    // TẠO KEY R2
    // ================================

    const objectKey =
      `${folderName}/${safeFileName}`;

    console.log(
      "R2 UPLOAD START:",
      objectKey
    );

    // ================================
    // ĐỌC FILE
    // ================================

    const bytes =
      await file.arrayBuffer();

    // ================================
    // KIỂM TRA R2 BINDING
    // ================================

    if (
      !env.UPLOADS
    ) {
      throw new Error(
        "Không tìm thấy R2 binding UPLOADS."
      );
    }

    // ================================
    // UPLOAD R2
    // ================================

    try {
      await env.UPLOADS.put(
        objectKey,
        bytes,
        {
          httpMetadata: {
            contentType:
              file.type ||
              "image/jpeg",
          },
        }
      );

      console.log(
        "R2 UPLOAD DONE:",
        objectKey
      );
    } catch (
      r2Error
    ) {
      console.error(
        "R2 PUT FAILED:",
        r2Error
      );

      throw new Error(
        `R2 không thể upload ảnh ${file.name}.`
      );
    }

    // ================================
    // TẠO URL
    // ================================

    const imageUrl =
      `/uploads/${objectKey}`;

    console.log(
      "UPLOAD SUCCESS:",
      imageUrl
    );

    // ================================
    // TRẢ KẾT QUẢ
    // ================================

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

            order:
              1,
          },
        ],
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "UPLOAD IMAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Không thể upload ảnh.",
      },
      {
        status: 500,
      }
    );
  }
}