import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "Amazon Admin <noreply@amazonstore.com>";

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0F766E; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #333; margin-bottom: 20px;">
          You requested a password reset. Use the following 6-digit code to verify your identity:
        </p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0F766E;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px; margin-bottom: 8px;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
