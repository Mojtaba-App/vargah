'use client';

type PdfViewerProps = {
  pdfUrl: string;
  title: string;
};

export function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        <a
          href={pdfUrl}
          download
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm hover:opacity-90"
        >
          دانلود PDF
        </a>
      </div>
      <div className="bg-muted/30 flex min-h-[500px] flex-col items-center justify-center p-8">
        <div className="mb-4 text-6xl">📄</div>
        <p className="mb-2 text-lg font-medium">ورق‌زن آنلاین PDF</p>
        <p className="text-muted-foreground mb-6 max-w-md text-center text-sm">
          نمایشگر PDF تعاملی در فاز بعد با کتابخانه تخصصی پیاده‌سازی می‌شود. فعلاً فایل PDF قابل
          دانلود است.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm"
          >
            صفحه قبل
          </button>
          <span className="text-muted-foreground flex items-center px-3 text-sm">۱ / {84}</span>
          <button
            type="button"
            className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm"
          >
            صفحه بعد
          </button>
        </div>
      </div>
    </div>
  );
}
