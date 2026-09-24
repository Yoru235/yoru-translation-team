import { R2_PUBLIC_DOMAIN } from "@/lib/media";

const ALLOWED_PREFIXES = [
  "covers/",
  "credits/",
  "avatars/",
  "chapters/",
  "novels/",
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
      return new Response("Forbidden", {
        status: 403,
      });
    }

    // Chuyển hướng 301 vĩnh viễn trực tiếp sang CDN R2 img.yoruteam.com
    // Worker chỉ tốn <0.1ms CPU để redirect, sau đó trình duyệt tự tải trực tiếp từ CDN
    return Response.redirect(`${R2_PUBLIC_DOMAIN}/${objectKey}`, 301);
  } catch (error) {
    console.error("R2 MEDIA REDIRECT ERROR:", error);

    return new Response(
      "Không thể tải nội dung.",
      { status: 500 }
    );
  }
}
