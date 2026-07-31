const nodemailer = require('nodemailer');

/**
 * Send password reset OTP email using nodemailer.
 * Falls back to console logging if SMTP environment variables are not configured.
 */
const sendResetOTPEmail = async (email, otp) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"21st Tech Security" <no-reply@21sttech.com>';

  const subject = 'Your password reset OTP';
  const textContent = `Hello,\n\nYour OTP is:\n\n${otp}\n\nThis OTP expires in 5 minutes.\n\nIf you did not request this, ignore this email.`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #09090b; color: #f3f4f6; padding: 32px; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">21st Tech</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Security & Password Recovery</p>
      </div>
      
      <div style="background-color: #18181b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; text-align: center;">
        <p style="color: #d4d4d8; font-size: 14px; margin-top: 0;">Hello,</p>
        <p style="color: #a1a1aa; font-size: 13px;">Your password reset Verification Code (OTP) is:</p>
        
        <div style="background-color: #09090b; border: 1px solid #3f3f46; display: inline-block; padding: 14px 28px; border-radius: 10px; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #818cf8;">${otp}</span>
        </div>
        
        <p style="color: #f43f5e; font-size: 12px; font-weight: 600; margin-bottom: 0;">⏰ This OTP expires in 5 minutes.</p>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: #71717a; text-align: center; line-height: 1.5;">
        <p>If you did not request a password reset, please ignore this email or contact security if you suspect unauthorized access.</p>
      </div>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`[EmailService] OTP email successfully dispatched to ${email}`);
      return { sent: true, method: 'smtp' };
    } catch (err) {
      console.error('[EmailService] SMTP Dispatch Failed:', err.message);
      // Fall through to console logging fallback
    }
  }

  console.log('\n========================================');
  console.log(`[EmailService - DEV FALLBACK] Password Reset OTP for ${email}:`);
  console.log(`>>> OTP CODE: ${otp} <<<`);
  console.log('========================================\n');

  return { sent: true, method: 'console_fallback' };
};

module.exports = {
  sendResetOTPEmail
};
