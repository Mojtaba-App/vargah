'use client';

type PdfViewerProps = {
  pdfUrl: string;
  title: string;
};

export function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        <a
          href={pdfUrl}
          download
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          دانلود PDF
        </a>
      </div>
      <div className="flex min-h-[500px] flex-col items-center justify-center bg-muted/30 p-8">
        <div className="mb-4 text-6xl">📄</div>
        <p className="mb-2 text-lg font-medium">ورق‌زن آنلاین PDF</p>
        <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
          نمایشگر PDF تعاملی در فاز بعد با کتابخانه تخصصی پیاده‌سازی می‌شود. فعلاً فایل PDF قابل
          دانلود است.
        </p>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
            صفحه قبل
          </button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">۱ / {84}</span>
          <button type="button" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
            صفحه بعد
          </button>
        </div>
      </div>
    </div>
  );
}
