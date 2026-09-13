import { NextResponse } from 'next/server';

/** مسیرهای عمومی OTP حذف شده‌اند — از /api/auth/login استفاده کنید. */
export async function POST() {
  return NextResponse.json({ error: 'GONE' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'GONE' }, { status: 410 });
}
