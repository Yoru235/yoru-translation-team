import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rawQuery } from "@/lib/db";
import { kvGet, kvDelete } from "@/lib/kv";

export async function POST(request: Request) {
  try {
    let body: {
      email?: string;
      resetToken?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const resetToken = body.resetToken ? String(body.resetToken).trim() : "";
    const newPassword = body.newPassword ? String(body.newPassword) : "";
    const confirmPassword = body.confirmPassword
      ? String(body.confirmPassword)
      : "";

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng điền đầy đủ các trường thông tin.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu xác nhận không khớp.",
        },
        { status: 400 }
      );
    }

    // 1. Kiểm tra reset token từ KV
    const kvKey = `reset_token:${email}`;
    const tokenDataStr = await kvGet(kvKey);

    if (!tokenDataStr) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ bước gửi mã OTP.",
        },
        { status: 400 }
      );
    }

    let tokenData: { resetToken: string };
    try {
      tokenData = JSON.parse(tokenDataStr);
    } catch {
      await kvDelete(kvKey);
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu phiên không hợp lệ. Vui lòng thử lại.",
        },
        { status: 400 }
      );
    }

    if (tokenData.resetToken !== resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã bảo mật đặt lại mật khẩu không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // 2. Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 3. Cập nhật vào DB
    await rawQuery(
      "UPDATE User SET passwordHash = ?, updatedAt = datetime('now') WHERE email = ?",
      [passwordHash, email]
    );

    // 4. Xóa reset token khỏi KV
    await kvDelete(kvKey);

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi không xác định khi đặt lại mật khẩu.",
      },
      { status: 500 }
    );
  }
}
