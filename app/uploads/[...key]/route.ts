import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

const ALLOWED_PREFIXES = [
  "covers/",
  "credits/",
  "avatars/",
];

function isAllowedKey(key: string) {
  if (
    key.includes("..") ||
    key.includes("\\") ||
    key.startsWith("/")
  ) {
    return false;
  }

  return ALLOWED_PREFIXES.some((prefix) =>
    key.startsWith(prefix)
  );
}

function getContentType(key: string) {
  const extension = key
    .split(".")
    .pop()
    ?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      key: string[];
    }>;
  }
) {
  try {
    const { key } = await context.params;

    const objectKey = key.join("/");

    if (!isAllowedKey(objectKey)) {
      return new NextResponse("Forbidden", {
        status: 403,
      });
    }

    const object = await env.UPLOADS.get(objectKey);

    if (!object) {
      return new NextResponse("Not Found", {
        status: 404,
      });
    }

    const headers = new Headers();

    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType ||
        getContentType(objectKey)
    );

    headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("R2 MEDIA ERROR:", error);

    return new NextResponse(
      "Không thể tải ảnh.",
      { status: 500 }
    );
  }
}