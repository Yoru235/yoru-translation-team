import { NextResponse } from "next/server";
import { kvGet, kvSet, kvDelete } from "@/lib/kv";

export async function POST(request: Request) {
  try {
    let body: { email?: string; otp?: string } = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const otp = body.otp ? String(body.otp).trim() : "";

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập đầy đủ email và mã OTP.",
        },
        { status: 400 }
      );
    }

    const kvKey = `otp:forgot_password:${email}`;
    const storedDataStr = await kvGet(kvKey);

    if (!storedDataStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã xác nhận đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới.",
        },
        { status: 400 }
      );
    }

    let storedData: { otp: string; attempts: number; createdAt: number };
    try {
      storedData = JSON.parse(storedDataStr);
    } catch {
      await kvDelete(kvKey);
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu xác thực không hợp lệ. Vui lòng thử lại.",
        },
        { status: 400 }
      );
    }

    // Kiểm tra số lần nhập sai
    if (storedData.otp !== otp) {
      storedData.attempts = (storedData.attempts || 0) + 1;

      if (storedData.attempts >= 5) {
        await kvDelete(kvKey);
        return NextResponse.json(
          {
            success: false,
            error: "Bạn đã nhập sai mã xác nhận quá 5 lần. Vui lòng yêu cầu mã mới.",
          },
          { status: 400 }
        );
      }

      // Cập nhật lại attempts vào KV
      await kvSet(kvKey, JSON.stringify(storedData), { expirationTtl: 300 });

      return NextResponse.json(
        {
          success: false,
          error: `Mã xác nhận không chính xác. Bạn còn ${5 - storedData.attempts} lần thử.`,
        },
        { status: 400 }
      );
    }

    // OTP chính xác -> Xóa OTP cũ và tạo Reset Token bảo mật
    await kvDelete(kvKey);

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    // Lưu reset token vào KV với TTL 10 phút (600s)
    await kvSet(
      `reset_token:${email}`,
      JSON.stringify({
        resetToken,
        verifiedAt: Date.now(),
      }),
      { expirationTtl: 600 }
    );

    return NextResponse.json({
      success: true,
      resetToken,
      message: "Xác thực mã OTP thành công.",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi không xác định khi xác thực OTP.",
      },
      { status: 500 }
    );
  }
}
