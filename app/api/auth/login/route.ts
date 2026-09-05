import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
  email?: string;
  password?: string;
};

const { email, password } = body;

if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập tài khoản và mật khẩu.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản hoặc mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản đã bị khóa.",
        },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản hoặc mật khẩu không đúng.",
        },
        { status: 401 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
    } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi không xác định.",
      },
      { status: 500 }
    );
  }
}