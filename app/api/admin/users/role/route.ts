import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function PUT(request: Request) {
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
          error: "Bạn không có quyền cấp quyền thành viên.",
        },
        { status: 403 }
      );
    }

    // ==============================
    // ĐỌC DỮ LIỆU
    // ==============================

    const body = await request.json();

    const { email, role } = body;

    // ==============================
    // KIỂM TRA EMAIL
    // ==============================

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập email.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==============================
    // KIỂM TRA ROLE
    // ==============================

    if (role !== "EDITOR" && role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Vai trò không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // ==============================
    // ADMIN KHÔNG ĐƯỢC CẤP ADMIN
    // ==============================

    if (
      currentUser.role === "ADMIN" &&
      role === "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ADMIN không thể cấp quyền ADMIN cho tài khoản khác.",
        },
        { status: 403 }
      );
    }

    // ==============================
    // TÌM USER
    // ==============================

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy tài khoản với email này.",
        },
        { status: 404 }
      );
    }

    // ==============================
    // KHÔNG ĐƯỢC ĐỔI OWNER
    // ==============================

    if (user.role === "OWNER") {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể thay đổi quyền của OWNER.",
        },
        { status: 403 }
      );
    }

    // ==============================
    // CẤP / ĐỔI QUYỀN
    // ==============================

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role,
        isActive: true,
      },
    });

    // ==============================
    // TRẢ KẾT QUẢ
    // ==============================

    return NextResponse.json({
      success: true,
      message:
        role === "EDITOR"
          ? `Đã cấp quyền nhóm dịch cho ${updatedUser.email}.`
          : `Đã cấp quyền ADMIN cho ${updatedUser.email}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cấp quyền cho tài khoản.",
      },
      { status: 500 }
    );
  }
}