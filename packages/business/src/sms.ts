import type { SmsConfig } from './messaging-config';

type SendSmsInput = {
  config: SmsConfig;
  to: string;
  message: string;
  templateId?: string;
  parameters?: Array<{ name: string; value: string }>;
};

function normalizeMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('98')) return digits.slice(2);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

async function sendViaKavenegar(config: SmsConfig, to: string, message: string) {
  if (!config.apiKey) throw new Error('API Key کاوه‌نگار تنظیم نشده');

  const receptor = normalizeMobile(to);
  const sender = config.sender || undefined;
  const url = new URL('https://api.kavenegar.com/v1/' + config.apiKey + '/sms/send.json');
  url.searchParams.set('receptor', receptor);
  url.searchParams.set('message', message);
  if (sender) url.searchParams.set('sender', sender);

  const res = await fetch(url.toString(), { method: 'GET' });
  const data = (await res.json()) as { return?: { status?: number; message?: string } };
  if (!res.ok || data.return?.status !== 200) {
    throw new Error(data.return?.message ?? 'ارسال پیامک از طریق کاوه‌نگار ناموفق بود');
  }
}

async function sendViaMelipayamak(config: SmsConfig, to: string, message: string) {
  if (!config.username || !config.password) {
    throw new Error('نام کاربری یا رمز ملی‌پیامک تنظیم نشده');
  }

  const res = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
      to: normalizeMobile(to),
      from: config.sender || config.lineNumber,
      text: message,
      isflash: false,
    }),
  });

  const data = (await res.json()) as { Value?: string; RetStatus?: number };
  if (!res.ok || String(data.RetStatus) !== '1') {
    throw new Error(data.Value ?? 'ارسال پیامک از طریق ملی‌پیامک ناموفق بود');
  }
}

async function sendViaSmsIr(
  config: SmsConfig,
  to: string,
  message: string,
  templateId?: string,
  parameters?: Array<{ name: string; value: string }>,
) {
  if (!config.apiKey) throw new Error('API Key سرویس SMS.ir تنظیم نشده');

  const mobile = normalizeMobile(to);

  if (templateId) {
    const res = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-KEY': config.apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId: Number(templateId),
        parameters: parameters ?? [],
      }),
    });

    const data = (await res.json()) as { status?: number; message?: string };
    if (!res.ok || data.status !== 1) {
      throw new Error(data.message ?? 'ارسال الگوی SMS.ir ناموفق بود');
    }
    return;
  }

  if (!config.lineNumber) {
    throw new Error('برای SMS.ir ارسال فقط از طریق الگو با شناسه امکان‌پذیر است');
  }

  const res = await fetch('https://api.sms.ir/v1/send/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-KEY': config.apiKey,
    },
    body: JSON.stringify({
      lineNumber: Number(config.lineNumber),
      messageText: message,
      mobiles: [mobile],
    }),
  });

  const data = (await res.json()) as { status?: number; message?: string };
  if (!res.ok || data.status !== 1) {
    throw new Error(data.message ?? 'ارسال پیامک SMS.ir ناموفق بود');
  }
}

export async function sendSms({ config, to, message, templateId, parameters }: SendSmsInput) {
  if (!config.enabled) throw new Error('ارسال پیامک غیرفعال است');

  switch (config.provider) {
    case 'kavenegar':
      await sendViaKavenegar(config, to, message);
      break;
    case 'melipayamak':
      await sendViaMelipayamak(config, to, message);
      break;
    case 'sms_ir':
      await sendViaSmsIr(config, to, message, templateId, parameters);
      break;
    default:
      throw new Error('سرویس‌دهنده پیامک نامعتبر است');
  }

  return { ok: true as const };
}

export async function testSmsConnection(config: SmsConfig) {
  if (!config.enabled) {
    return {
      ok: false as const,
      message: 'ارسال پیامک غیرفعال است — برای تست، گزینه «فعال» را روشن کنید',
    };
  }

  switch (config.provider) {
    case 'kavenegar': {
      if (!config.apiKey) throw new Error('API Key کاوه‌نگار الزامی است');
      const res = await fetch(`https://api.kavenegar.com/v1/${config.apiKey}/account/info.json`);
      const data = (await res.json()) as { return?: { status?: number; message?: string } };
      if (!res.ok || data.return?.status !== 200) {
        throw new Error(data.return?.message ?? 'اتصال به کاوه‌نگار برقرار نشد');
      }
      return { ok: true as const, message: 'اتصال به کاوه‌نگار برقرار شد' };
    }
    case 'melipayamak': {
      if (!config.username || !config.password) {
        throw new Error('نام کاربری و رمز ملی‌پیامک الزامی است');
      }
      const url = new URL('https://rest.payamak-panel.com/api/SendSMS/GetCredit');
      url.searchParams.set('username', config.username);
      url.searchParams.set('password', config.password);
      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        RetStatus?: number;
        StrRetStatus?: string;
        Value?: string;
      };
      if (!res.ok || String(data.RetStatus) !== '1') {
        throw new Error(data.StrRetStatus ?? data.Value ?? 'اتصال به ملی‌پیامک برقرار نشد');
      }
      return { ok: true as const, message: 'اتصال به ملی‌پیامک برقرار شد' };
    }
    case 'sms_ir': {
      if (!config.apiKey) throw new Error('API Key SMS.ir الزامی است');
      const res = await fetch('https://api.sms.ir/v1/credit', {
        headers: {
          Accept: 'application/json',
          'X-API-KEY': config.apiKey,
        },
      });
      const data = (await res.json()) as { status?: number; message?: string };
      if (!res.ok || data.status !== 1) {
        throw new Error(data.message ?? 'اتصال به SMS.ir برقرار نشد');
      }
      return { ok: true as const, message: 'اتصال به SMS.ir برقرار شد' };
    }
    default:
      throw new Error('سرویس‌دهنده پیامک نامعتبر است');
  }
}
