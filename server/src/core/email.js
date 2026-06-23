/**
 * src/core/email.js — Nodemailer email service
 */
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // dùng STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''), // xóa khoảng trắng nếu có
  },
})

/** Gửi OTP xác minh email khi đăng ký */
export async function sendVerifyEmail(to, otp) {
  await transporter.sendMail({
    from: `"ITechZone" <${process.env.GMAIL_USER}>`,
    to,
    subject: '✅ Xác minh tài khoản ITechZone',
    html: buildOtpTemplate({
      title: 'Xác minh tài khoản',
      subtitle: 'Cảm ơn bạn đã đăng ký ITechZone! Dùng mã OTP bên dưới để kích hoạt tài khoản.',
      otp,
      note: 'Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.',
    }),
  })
}

/** Gửi OTP quên mật khẩu */
export async function sendForgotPasswordEmail(to, otp) {
  await transporter.sendMail({
    from: `"ITechZone" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🔐 Đặt lại mật khẩu ITechZone',
    html: buildOtpTemplate({
      title: 'Đặt lại mật khẩu',
      subtitle: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
      otp,
      note: 'Mã có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    }),
  })
}

/** Template HTML email chứa OTP */
function buildOtpTemplate({ title, subtitle, otp, note }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">⚡ ITechZone</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${title}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">${subtitle}</p>
            <!-- OTP Box -->
            <div style="text-align:center;margin:32px 0;">
              <div style="display:inline-block;background:#fef2f2;border:2px dashed #dc2626;border-radius:12px;padding:20px 40px;">
                <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Mã OTP của bạn</p>
                <p style="margin:0;color:#dc2626;font-size:42px;font-weight:900;letter-spacing:12px;">${otp}</p>
              </div>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">${note}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2024 ITechZone · Không trả lời email này</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
