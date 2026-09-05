import { NextResponse } from "next/server";
import {
  SITE_LOCK_COOKIE,
  createSiteLockToken,
} from "@/lib/site-lock";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password = String(body.password ?? "");
    const correctPassword = process.env.SITE_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "SITE_PASSWORD chưa được cấu hình.",
        },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: SITE_LOCK_COOKIE,
      value: createSiteLockToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("SITE LOCK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Có lỗi xảy ra.",
      },
      { status: 500 }
    );
  }
}