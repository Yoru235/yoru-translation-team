import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      username,
      email,
      password,
      confirmPassword,
    } = body;

    // Kiểm tra dữ liệu
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập đầy đủ thông tin.",
        },
        { status: 400 }
      );
    }

    // Chuẩn hóa
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Kiểm tra mật khẩu
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu nhập lại không khớp.",
        },
        { status: 400 }
      );
    }

    // Kiểm tra độ dài username
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên người dùng phải có ít nhất 3 ký tự.",
        },
        { status: 400 }
      );
    }

    // Kiểm tra độ dài mật khẩu
    if (String(password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu phải có ít nhất 6 ký tự.",
        },
        { status: 400 }
      );
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Email này đã được sử dụng.",
        },
        { status: 409 }
      );
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await prisma.user.findUnique({
      where: {
        username: cleanUsername,
      },
    });

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Tên người dùng này đã được sử dụng.",
        },
        { status: 409 }
      );
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 12);

    // Tạo tài khoản
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        role: "READER",
        isActive: true,
        level: 1,
        points: 0,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tạo tài khoản thành công.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Không thể tạo tài khoản.",
      },
      { status: 500 }
    );
  }
}