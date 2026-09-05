import { NextRequest, NextResponse } from "next/server";
import {
  SITE_LOCK_COOKIE,
  isValidSiteLockToken,
} from "@/lib/site-lock";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Cho phép trang nhập mật khẩu
  if (pathname === "/unlock") {
    return NextResponse.next();
  }

  // Cho phép API kiểm tra mật khẩu
  if (pathname === "/api/site-lock") {
    return NextResponse.next();
  }

  // Cho phép các tài nguyên cần thiết của Next.js
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Cho phép logo hiển thị ở trang unlock
  if (pathname === "/logo.png") {
    return NextResponse.next();
  }

  const token = request.cookies.get(
    SITE_LOCK_COOKIE
  )?.value;

  // Chưa mở khóa → chuyển sang trang nhập mật khẩu
  if (!isValidSiteLockToken(token)) {
    const url = request.nextUrl.clone();

    url.pathname = "/unlock";
    url.search = "";

    return NextResponse.redirect(url);
  }

  // Đã mở khóa → cho truy cập website
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};