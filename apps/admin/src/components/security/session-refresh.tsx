'use client';

import { adminApiPath } from '@/lib/base-path';
import { useEffect } from 'react';

/** تمدید خودکار JWT کوتاه‌مدت با چرخش Refresh Token */
export function SessionRefresh() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch(adminApiPath('/api/auth/refresh'), { method: 'POST', credentials: 'include' });
      } catch {
        // نادیده — کاربر در صورت انقضا به login هدایت می‌شود
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
