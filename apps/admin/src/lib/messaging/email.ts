import type { EmailConfig } from '@vargah/business/messaging-config';

type SendEmailInput = {
  config: EmailConfig;
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ config, to, subject, text }: SendEmailInput) {
  if (!config.enabled || !config.host || !config.fromEmail) {
    throw new Error('تنظیمات ایمیل فعال یا کامل نیست');
  }

  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? {
          user: config.user,
          pass: config.password,
        }
      : undefined,
  });

  await transport.sendMail({
    from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail,
    to,
    subject,
    text,
  });

  return { ok: true as const };
}

export async function testEmailConnection(config: EmailConfig) {
  if (!config.host) {
    throw new Error('آدرس سرور SMTP الزامی است');
  }

  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? {
          user: config.user,
          pass: config.password,
        }
      : undefined,
  });

  await transport.verify();
  return { ok: true as const, message: 'اتصال SMTP با موفقیت برقرار شد' };
}
