'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@vargah/ui/components/skeleton';

export const PdfViewerLazy = dynamic(
  () => import('./pdf-viewer').then((mod) => mod.PdfViewer),
  {
    loading: () => (
      <div className="overflow-hidden rounded-xl border border-border" aria-busy="true" aria-label="در حال بارگذاری نمایشگر PDF">
        <Skeleton className="h-12 rounded-none" />
        <Skeleton className="min-h-[500px] rounded-none" />
      </div>
    ),
    ssr: false,
  },
);
