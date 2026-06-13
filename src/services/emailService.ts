import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@docnet.com.au';
const FROM_NAME = 'DocNet';

const sandboxTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.EMAIL_PORT) || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let gmailTransporter: nodemailer.Transporter | null = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

let liveTransporter: nodemailer.Transporter | null = null;
if (process.env.MAILTRAP_API_KEY) {
  liveTransporter = nodemailer.createTransport({
    host: 'live.smtp.mailtrap.io',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'api',
      pass: process.env.MAILTRAP_API_KEY,
    },
  });
}

function buildEmailContent(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">DocNet Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f0f4f8; border-radius: 8px; margin: 16px 0;">
        ${code}
      </div>
      <p>This code expires in 15 minutes.</p>
      <p style="color: #64748b; font-size: 12px;">If you didn't create a DocNet account, you can ignore this email.</p>
    </div>
  `;
}

async function tryGmail(email: string, html: string): Promise<boolean> {
  if (!gmailTransporter) return false;
  try {
    await gmailTransporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify your DocNet account',
      html,
    });
    return true;
  } catch (error: any) {
    console.error('Gmail SMTP failed:', error.message);
    return false;
  }
}

async function tryLiveMailtrap(email: string, html: string): Promise<boolean> {
  if (!liveTransporter) return false;
  try {
    await liveTransporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: 'Verify your DocNet account',
      html,
    });
    return true;
  } catch (error: any) {
    console.warn('Live Mailtrap failed:', error.message);
    return false;
  }
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const html = buildEmailContent(code);

  if (await tryGmail(email, html)) return;
  if (await tryLiveMailtrap(email, html)) return;

  await sandboxTransporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your DocNet account',
    html,
  });
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
