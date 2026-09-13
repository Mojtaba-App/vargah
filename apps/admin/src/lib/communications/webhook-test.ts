import { WebhookProvider } from '@/lib/communications/enums';

const TEST_MESSAGE = '✅ پیام تست اتصال از پنل مدیریت وارگه';

type WebhookTestInput = {
  url: string;
  provider: WebhookProvider;
  secret?: string | null;
};

function resolveSendMessageUrl(url: string) {
  return url.includes('sendMessage') ? url : `${url.replace(/\/$/, '')}/sendMessage`;
}

async function assertOk(res: Response, fallback: string) {
  if (res.ok) return;
  const body = await res.text().catch(() => '');
  throw new Error(body || fallback);
}

export async function testWebhookConnection(input: WebhookTestInput): Promise<string> {
  const url = input.url.trim();
  if (!url) throw new Error('URL الزامی است');

  if (
    input.provider === WebhookProvider.TELEGRAM ||
    input.provider === WebhookProvider.EITAA ||
    input.provider === WebhookProvider.BALE
  ) {
    const label =
      input.provider === WebhookProvider.TELEGRAM
        ? 'تلگرام'
        : input.provider === WebhookProvider.EITAA
          ? 'ایتا'
          : 'بله';
    if (!input.secret?.trim()) throw new Error(`Chat ID ${label} الزامی است`);

    const res = await fetch(resolveSendMessageUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: input.secret.trim(),
        text: TEST_MESSAGE,
      }),
    });

    if (input.provider === WebhookProvider.TELEGRAM) {
      const data = (await res.json()) as { ok?: boolean; description?: string };
      if (!res.ok || data.ok === false) {
        throw new Error(data.description ?? 'اتصال به تلگرام برقرار نشد');
      }
    } else {
      await assertOk(res, `اتصال به ${label} برقرار نشد`);
    }

    return `اتصال به ${label} برقرار شد — پیام تست ارسال شد`;
  }

  if (input.provider === WebhookProvider.SLACK) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: TEST_MESSAGE }),
    });
    await assertOk(res, 'اتصال به اسلک برقرار نشد');
    return 'اتصال به اسلک برقرار شد — پیام تست ارسال شد';
  }

  if (input.provider === WebhookProvider.DISCORD) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: TEST_MESSAGE }),
    });
    await assertOk(res, 'اتصال به دیسکورد برقرار نشد');
    return 'اتصال به دیسکورد برقرار شد — پیام تست ارسال شد';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.secret?.trim() ? { 'X-Webhook-Secret': input.secret.trim() } : {}),
    },
    body: JSON.stringify({
      event: 'connection.test',
      title: 'تست اتصال',
      message: TEST_MESSAGE,
    }),
  });

  if (!res.ok) {
    throw new Error(`پاسخ ناموفق (HTTP ${res.status}) — اتصال Webhook برقرار نشد`);
  }

  return `اتصال Webhook برقرار شد (HTTP ${res.status})`;
}
