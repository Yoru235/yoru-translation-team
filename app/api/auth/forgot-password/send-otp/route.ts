import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import { kvGet, kvSet } from "@/lib/kv";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    let body: { email?: string } = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const email = body.email ? String(body.email).trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập địa chỉ email.",
        },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Địa chỉ email không hợp lệ.",
        },
        { status: 400 }
      );
    }

    // 1. Kiểm tra tài khoản trong Database
    const users = await rawQuery<{ id: string; email: string; isActive: number | boolean }>(
      "SELECT id, email, isActive FROM User WHERE email = ? LIMIT 1",
      [email]
    );
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy tài khoản với email này.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive && user.isActive !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản này đã bị khóa.",
        },
        { status: 403 }
      );
    }

    // 2. Kiểm tra Rate limit gửi mã (chờ 60s giữa các lần gửi)
    const existingDataStr = await kvGet(`otp:forgot_password:${email}`);
    if (existingDataStr) {
      try {
        const existingData = JSON.parse(existingDataStr);
        const elapsed = (Date.now() - existingData.createdAt) / 1000;
        if (elapsed < 60) {
          const waitSecs = Math.ceil(60 - elapsed);
          return NextResponse.json(
            {
              success: false,
              error: `Vui lòng đợi ${waitSecs} giây trước khi yêu cầu mã mới.`,
            },
            { status: 429 }
          );
        }
      } catch {
        // Parse error, tiếp tục
      }
    }

    // 3. Tạo mã OTP ngẫu nhiên 6 chữ số
    const otpBytes = new Uint32Array(1);
    crypto.getRandomValues(otpBytes);
    const otp = (100000 + (otpBytes[0] % 900000)).toString();

    // 4. Lưu vào Cloudflare KV (hết hạn sau 5 phút = 300 giây)
    const otpPayload = {
      otp,
      attempts: 0,
      createdAt: Date.now(),
    };
    await kvSet(`otp:forgot_password:${email}`, JSON.stringify(otpPayload), {
      expirationTtl: 300,
    });

    // 5. Gửi email OTP qua Resend API
    await sendOtpEmail({
      toEmail: email,
      otp,
      expiresInMinutes: 5,
    });

    return NextResponse.json({
      success: true,
      message: "Mã xác nhận OTP đã được gửi về email của bạn.",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi không xác định khi gửi mã OTP.",
      },
      { status: 500 }
    );
  }
}
