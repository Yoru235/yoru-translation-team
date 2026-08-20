import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({
      success: true,
      message: "Đăng xuất thành công.",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể đăng xuất.",
      },
      { status: 500 }
    );
  }
}