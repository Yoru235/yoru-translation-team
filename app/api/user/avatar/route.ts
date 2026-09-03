import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "yoru_session";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn chưa đăng nhập.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const avatar =
      typeof body.avatar === "string"
        ? body.avatar.trim()
        : "";

    if (!avatar) {
      return NextResponse.json(
        {
          success: false,
          error: "Chưa có ảnh avatar.",
        },
        { status: 400 }
      );
    }

    if (
      !avatar.startsWith("/uploads/") &&
      !avatar.startsWith("http://") &&
      !avatar.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Đường dẫn avatar không hợp lệ.",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatar,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE AVATAR ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể cập nhật avatar.",
      },
      { status: 500 }
    );
  }
}