'use client';

import { useEffect } from 'react';

/** سایت فقط فارسی و RTL است */
export function DirectionSync() {
  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
    document.body.dir = 'rtl';
  }, []);

  return null;
}
