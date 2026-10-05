import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

export class EmailService {
  /**
   * Resend API email sender
   */
  private static async sendViaResend(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<{ delivered: boolean; info?: string; destination?: string }> {
    const apiKey = process.env.RESEND_API_KEY || ENV.RESEND_API_KEY;
    if (!apiKey || apiKey.includes('your_resend') || apiKey === 'placeholder') {
      console.warn('[Resend Warning] RESEND_API_KEY is not configured. Please get a free API key at https://resend.com');
      return { delivered: false, info: 'RESEND_API_KEY not configured. Add valid key in .env' };
    }

    const from = process.env.RESEND_FROM_EMAIL || ENV.RESEND_FROM_EMAIL || 'SMIT Web Class <onboarding@resend.dev>';

    try {
      console.log(`[Resend] Dispatching email to: ${to} from: ${from}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        if (response.status === 401 || data?.name === 'validation_error' || data?.message?.includes('invalid')) {
          console.warn('[Resend Notice] Provided RESEND_API_KEY is invalid or expired. To send real emails, update RESEND_API_KEY in .env');
          return { delivered: false, info: 'Invalid Resend API key. Please check .env RESEND_API_KEY.' };
        }

        // If Resend free sandbox restriction triggers (can only send to verified account owner),
        // gracefully attempt fallback sending to the sandbox account owner so the user still receives it in Gmail!
        if (data?.statusCode === 403 && data?.message?.includes('your own email address')) {
          const match = data.message.match(/\(([^)]+)\)/);
          const sandboxOwner = match ? match[1] : 'malikabubakkar523@gmail.com';
          console.warn(`[Resend Sandbox Notice] Target "${to}" is unverified in free tier. Forwarding to verified owner "${sandboxOwner}"`);

          const retryResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from,
              to: [sandboxOwner],
              subject: `[Sandbox: For ${to}] ${subject}`,
              html: `
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px 16px; border-radius:12px; margin-bottom:16px; font-family:sans-serif; font-size:13px; color:#92400e;">
                  <strong>⚡ Resend Sandbox Notice:</strong> Intended recipient was <code>${to}</code>. Delivered to verified sandbox account <code>${sandboxOwner}</code>.
                </div>
                ${html}
              `,
              text: `[Sandbox notice: Intended for ${to}]\n\n${text}`,
            }),
          });

          const retryData = (await retryResponse.json()) as any;
          if (retryResponse.ok) {
            console.log(`✅ [Resend] Dispatched to sandbox verified inbox: ${sandboxOwner} (ID: ${retryData.id})`);
            return { delivered: true, info: retryData.id, destination: sandboxOwner };
          }
        }

        console.error('[Resend Error]', data);
        return { delivered: false, info: data.message || 'Resend API error' };
      }

      console.log(`✅ [Resend] Email successfully dispatched to ${to} (MessageId: ${data.id})`);
      return { delivered: true, info: data.id, destination: to };
    } catch (err: any) {
      console.error('[Resend Exception]', err);
      return { delivered: false, info: err.message };
    }
  }

  /**
   * SMTP Nodemailer fallback transporter
   */
  private static getSmtpTransporter() {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.GMAIL_APP_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;

    if (!user || !pass) return null;

    if (host.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  /**
   * Send Password Reset OTP via Resend with ultra-clean modern HTML formatting
   */
  public static async sendPasswordResetOtp(
    options: SendOtpEmailOptions
  ): Promise<{ delivered: boolean; info?: string; destination?: string }> {
    const { to, otp, userName = 'Learner' } = options;

    console.log(`\n======================================================`);
    console.log(`🚀 [DISPATCHING OTP] Recipient: ${to}`);
    console.log(`🔢 5-DIGIT VERIFICATION CODE: >>> [ ${otp} ] <<<`);
    console.log(`⏱️  VALIDITY: 10 Minutes`);
    console.log(`======================================================\n`);

    const formattedDigits = otp
      .split('')
      .map(
        (digit) =>
          `<span style="display:inline-block; width:44px; height:54px; line-height:54px; font-size:32px; font-weight:800; font-family:'Segoe UI', Roboto, Helvetica, Arial, monospace; background:#ffffff; color:#1e40af; border:2px solid #93c5fd; border-radius:12px; margin:0 4px; box-shadow:0 4px 6px -1px rgba(59,130,246,0.1);">${digit}</span>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SMIT Web Class - Password Reset Code</title>
      </head>
      <body style="margin: 0; padding: 30px 15px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); padding: 36px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 10px 16px; border: 1px solid rgba(255, 255, 255, 0.25);">
                    <span style="font-size: 20px; vertical-align: middle;">🎓</span>
                    <span style="color: #ffffff; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; margin-left: 8px; text-transform: uppercase;">SMIT Web Class</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 18px 0 6px 0; letter-spacing: -0.5px;">Verification Code</h1>
              <p style="color: #bfdbfe; font-size: 13px; margin: 0; font-weight: 500;">One-Time Password for Account Security</p>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; text-align: center;">
              <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; text-align: left;">
                Hello ${userName},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 28px 0; text-align: left;">
                You requested a security verification code to reset the password for your SMIT Web Class account (<strong style="color: #0f172a;">${to}</strong>). Enter this 5-digit code in the portal to continue:
              </p>

              <!-- OTP CARD -->
              <div style="background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #60a5fa; border-radius: 20px; padding: 26px 16px; margin: 24px 0;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; color: #3b82f6; margin-bottom: 14px;">
                  Your 5-Digit Verification Code
                </div>
                <div style="margin: 0 auto; text-align: center;">
                  ${formattedDigits}
                </div>
                <div style="margin-top: 18px; display: inline-block; background: #ffffff; border: 1px solid #dbeafe; padding: 6px 14px; border-radius: 9999px;">
                  <span style="font-size: 12px; font-weight: 700; color: #ef4444;">⏱️ Expires in 10 minutes</span>
                </div>
              </div>

              <!-- SECURITY NOTICE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px; margin: 24px 0 16px 0; text-align: left;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                      🔒 <strong style="color: #0f172a;">Security Notice:</strong> Never share this code with anyone. SMIT instructors or staff will never request your verification code.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0; text-align: left;">
                If you did not request this password reset, please ignore this email or contact the SMIT IT admin team. Your account password remains unchanged.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <p style="font-size: 12px; font-weight: 600; color: #334155; margin: 0 0 4px 0;">
                Saylani Mass IT Training (SMIT) • Modern Web Class Portal
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Monday & Tuesday Cohort (4:00 PM – 6:00 PM) • Automated Security Service
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const plainText = `Hello ${userName},\n\nYour 5-digit SMIT Web Class password reset code is: ${otp}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.\n\nIf you did not request this, please ignore this email.\n\nSaylani Mass IT Training (SMIT)`;

    // 1. Primary delivery method: Resend API
    const resendResult = await this.sendViaResend(
      to,
      `SMIT Web Class: ${otp} is your verification code`,
      htmlContent,
      plainText
    );

    if (resendResult.delivered) {
      return resendResult;
    }

    // 2. Secondary fallback: SMTP Nodemailer (if configured)
    const transporter = this.getSmtpTransporter();
    if (transporter) {
      try {
        const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@smit.edu';
        const info = await transporter.sendMail({
          from: `"SMIT Web Class Portal" <${fromEmail}>`,
          to,
          subject: `SMIT Web Class: ${otp} is your verification code`,
          text: plainText,
          html: htmlContent,
        });
        console.log(`✅ [EmailService:SMTP] Dispatched to ${to} (MessageId: ${info.messageId})`);
        return { delivered: true, info: info.messageId, destination: to };
      } catch (err: any) {
        console.error(`⚠️ [EmailService:SMTP] Error:`, err.message);
      }
    }

    return {
      delivered: false,
      info: resendResult.info || 'No active email provider succeeded',
      destination: to,
    };
  }

  /**
   * Broadcast lesson email to students via Resend or SMTP
   */
  public static async sendBroadcastLessonEmail(
    recipients: { email: string; name: string }[],
    lessonDetails: {
      courseTitle: string;
      topicTitle: string;
      lessonTitle: string;
      lessonUrl: string;
      teacherName: string;
    }
  ): Promise<void> {
    console.log(`📢 [EmailService] Broadcasting lesson: "${lessonDetails.lessonTitle}" to ${recipients.length} students`);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; color: #fff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800;">🎓 New Class Lecture Posted</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${lessonDetails.courseTitle}</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #334155; margin-top: 0;">Your instructor <strong>${lessonDetails.teacherName}</strong> has posted a new lesson:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${lessonDetails.lessonTitle}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${lessonDetails.courseTitle} • ${lessonDetails.topicTitle}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${lessonDetails.lessonUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Watch Lesson Now &rarr;</a>
          </div>
        </div>
      </div>
    `;

    for (const recipient of recipients) {
      await this.sendViaResend(
        recipient.email,
        `New Lecture: ${lessonDetails.lessonTitle} (${lessonDetails.courseTitle})`,
        htmlContent,
        `New Lecture: ${lessonDetails.lessonTitle} (${lessonDetails.courseTitle})\nWatch now at: ${lessonDetails.lessonUrl}`
      );
    }
  }
}
