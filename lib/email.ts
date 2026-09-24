/**
 * Helper gửi email OTP xác thực cho tính năng Quên mật khẩu.
 * Sử dụng Resend API (HTTPS REST API) - tối ưu cho Cloudflare Workers & Serverless.
 * Tự động in mã OTP ra Terminal khi chạy môi trường local/dev.
 */

import { env } from "cloudflare:workers";

interface SendOtpEmailOptions {
  toEmail: string;
  otp: string;
  expiresInMinutes?: number;
}

function getEnvVar(key: string): string | undefined {
  try {
    if (typeof env !== "undefined" && (env as any)?.[key]) {
      return String((env as any)[key]);
    }
  } catch { }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
}

export async function sendOtpEmail({
  toEmail,
  otp,
  expiresInMinutes = 5,
}: SendOtpEmailOptions): Promise<{ success: boolean; message?: string }> {
  const subject = `[Yoru Team] Mã xác nhận đặt lại mật khẩu: ${otp}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã xác nhận Yoru Team</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 540px; margin: 40px auto; background-color: #181820; border: 1px solid #2e2e3d; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
              YORU TRANSLATION TEAM
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">
              Yêu cầu đặt lại mật khẩu tài khoản
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #e2e8f0;">
              Xin chào,
            </p>
            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong style="color: #a78bfa;">${toEmail}</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background: #232330; border: 1px dashed #7c3aed; border-radius: 14px; padding: 24px; text-align: center; margin: 28px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a78bfa;">
                Mã xác nhận của bạn:
              </p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 12px rgba(167, 139, 250, 0.5); font-family: monospace;">
                ${otp}
              </div>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #94a3b8;">
                (Mã này có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong>)
              </p>
            </div>

            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
              ⚠️ <em>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn vẫn được giữ an toàn.</em>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #121218; padding: 18px 24px; text-align: center; border-top: 1px solid #232330;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              © ${new Date().getFullYear()} Yoru Translation Team. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  // Gửi email qua Resend API (HTTPS REST API - Hoạt động tối ưu trên Cloudflare Workers)
  const resendApiKey = getEnvVar("RESEND_API_KEY");
  if (resendApiKey) {
    try {
      const fromEmail = getEnvVar("EMAIL_FROM") || "Yoru Team <onboarding@resend.dev>";
      console.log(`[EMAIL] Đang gửi qua Resend (From: ${fromEmail}, To: ${toEmail})...`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[EMAIL] OTP gửi thành công đến ${toEmail} qua Resend`);
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      console.error(`[EMAIL] Lỗi Resend HTTP ${res.status}:`, JSON.stringify(errData));
    } catch (err) {
      console.error("[EMAIL] Resend fetch failed:", err);
    }
  } else {
    console.warn("[EMAIL] Chưa tìm thấy RESEND_API_KEY trong env / Worker secrets.");
  }

  // Fallback in mã OTP ra Terminal Console khi chạy dev/test
  console.log("\n=======================================================");
  console.log(`🔑 [AUTH OTP CODE] Email: ${toEmail}`);
  console.log(`👉 Mã xác nhận OTP: [ ${otp} ]`);
  console.log(`⏳ Hết hạn sau: ${expiresInMinutes} phút`);
  console.log("=======================================================\n");

  return {
    success: true,
    message: "Mã OTP đã được tạo thành công.",
  };
}
