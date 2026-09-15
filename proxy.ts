import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Nếu người dùng chủ động truy cập vào /unlock, chuyển hướng về trang chủ /
  // nơi unlock modal overlay sẽ tự động hiển thị đè lên trang chủ
  if (pathname === "/unlock") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};