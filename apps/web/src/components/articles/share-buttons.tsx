'use client';

type ShareButtonsProps = {
  title: string;
  url: string;
};

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    { label: 'تلگرام', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { label: 'واتساپ', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    {
      label: 'توییتر',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">اشتراک‌گذاری:</span>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:bg-muted rounded-full border px-3 py-1 text-xs font-medium"
        >
          {link.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="border-border hover:bg-muted rounded-full border px-3 py-1 text-xs font-medium"
      >
        کپی لینک
      </button>
    </div>
  );
}
