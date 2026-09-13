const PERSIAN_SCRIPT = /[\u0600-\u06FF]/;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Estimate reading time in minutes — tuned for Persian and Latin content. */
export function estimateReadingMinutes(html: string): number {
  const text = stripHtml(html);
  if (!text) return 1;

  const chars = text.replace(/\s/g, '').length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const persianChars = (text.match(PERSIAN_SCRIPT) ?? []).length;
  const persianRatio = persianChars / Math.max(chars, 1);

  if (persianRatio > 0.25) {
    return Math.max(1, Math.ceil(chars / 900));
  }

  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTimeLabel(minutes: number): string {
  if (minutes <= 1) return '۱ دقیقه مطالعه';
  return `${minutes.toLocaleString('fa-IR')} دقیقه مطالعه`;
}
