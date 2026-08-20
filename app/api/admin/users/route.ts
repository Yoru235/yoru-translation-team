import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    // ==============================
    // KIỂM TRA NGƯỜI ĐANG ĐĂNG NHẬP
    // ==============================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    // ==============================
    // KIỂM TRA QUYỀN
    // ==============================

    if (
      currentUser.role !== "OWNER" &&
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn không có quyền xem danh sách thành viên.",
        },
        { status: 403 }
      );
    }

    // ==============================
    // LẤY DANH SÁCH USER
    // ==============================

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tải danh sách thành viên.",
      },
      { status: 500 }
    );
  }
}