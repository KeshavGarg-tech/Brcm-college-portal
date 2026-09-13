import { Resend } from "resend";
import { ENV } from "./env";

const resend = new Resend(ENV.resendApiKey);

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
) {
  if (!ENV.resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const result = await resend.emails.send({
    from: "BRCM College <onboarding@resend.dev>",
    to: email,
    subject: "Reset your BRCM College password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>BRCM College Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to create a new password:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
