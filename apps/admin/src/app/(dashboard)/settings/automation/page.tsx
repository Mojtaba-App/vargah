import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AutomationSettingsRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set('tab', 'automation');
  for (const [key, value] of Object.entries(params)) {
    if (key === 'tab' || value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else query.set(key, value);
  }
  redirect(`/settings?${query.toString()}`);
}
