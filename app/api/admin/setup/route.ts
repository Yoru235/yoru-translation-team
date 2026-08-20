import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập email, username và password.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu phải có ít nhất 8 ký tự.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email hoặc username đã tồn tại.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const owner = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã tạo tài khoản OWNER thành công.",
      user: {
        id: owner.id,
        email: owner.email,
        username: owner.username,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("CREATE OWNER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo tài khoản OWNER.",
      },
      { status: 500 }
    );
  }
}