export type AboutSocialLinks = {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  telegram?: string;
};

export type AboutTeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  social?: AboutSocialLinks;
  isActive?: boolean;
  sortOrder?: number;
};

export type AboutMilestone = {
  id: string;
  year: string;
  title: string;
  description: string;
};

export type AboutEthicsItem = {
  id: string;
  title: string;
  description: string;
};

export type AboutStats = {
  issueCount: number;
  activeYears: number;
  audienceCount: number;
  foundedYear: number;
};

export type AboutContent = {
  page: {
    eyebrow: string;
    title: string;
    description: string;
  };
  intro: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    ctaLabel: string;
  };
  stats: AboutStats;
  mission: {
    title: string;
    body: string;
  };
  history: {
    title: string;
    body: string;
  };
  milestones: AboutMilestone[];
  team: {
    title: string;
    subtitle: string;
    members: AboutTeamMember[];
  };
  ethics: {
    title: string;
    subtitle: string;
    items: AboutEthicsItem[];
  };
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
};

export const ABOUT_CONTENT_KEY = 'about_content';

const DEFAULT_AVATAR = '/images/mock/placeholder-avatar.svg';

export const DEFAULT_ABOUT_TEAM: AboutTeamMember[] = [
  {
    id: 'team-1',
    name: 'دکتر حسین نوری',
    role: 'سردبیر',
    bio: 'روزنامه‌نگار و پژوهشگر با ۲۰ سال سابقه در مطبوعات.',
    avatar: DEFAULT_AVATAR,
    social: { twitter: '#', linkedin: '#' },
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'team-2',
    name: 'زهرا اکبری',
    role: 'معاون سردبیر',
    bio: 'مسئول بخش سیاست و جامعه.',
    avatar: DEFAULT_AVATAR,
    social: { instagram: '#', linkedin: '#' },
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'team-3',
    name: 'امیرحسین جعفری',
    role: 'مدیر هنری',
    bio: 'طراح گرافیک و مسئول چیدمان شماره‌ها.',
    avatar: DEFAULT_AVATAR,
    social: { instagram: '#' },
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'team-4',
    name: 'نرگس صادقی',
    role: 'ویراستار ارشد',
    bio: 'مسئول ویراستاری و کنترل کیفیت محتوا.',
    avatar: DEFAULT_AVATAR,
    social: { linkedin: '#' },
    isActive: true,
    sortOrder: 4,
  },
];

export const DEFAULT_ABOUT_MILESTONES: AboutMilestone[] = [
  {
    id: 'ms-1',
    year: '۱۴۰۲',
    title: 'آغاز به‌کار',
    description: 'انتشار نخستین شماره دیجیتال با تیمی کوچک اما متمرکز بر کیفیت.',
  },
  {
    id: 'ms-2',
    year: '۱۴۰۳',
    title: 'گسترش تحریریه',
    description: 'افزایش پوشش حوزه‌های اقتصاد، فرهنگ و فناوری و تثبیت ریتم ماهانه.',
  },
  {
    id: 'ms-3',
    year: '۱۴۰۴',
    title: 'جامعه مخاطبان',
    description: 'عبور از مرز ده‌ها هزار مخاطب فعال و تقویت کانال‌های ارتباط با خوانندگان.',
  },
];

export const DEFAULT_ABOUT_ETHICS: AboutEthicsItem[] = [
  {
    id: 'eth-1',
    title: 'استقلال تحریریه',
    description: 'هیچ‌گونه فشار تجاری یا سیاسی بر محتوا پذیرفته نیست.',
  },
  {
    id: 'eth-2',
    title: 'دقت در گزارش',
    description: 'تمام اطلاعات قبل از انتشار تأیید و منبع‌یابی می‌شوند.',
  },
  {
    id: 'eth-3',
    title: 'احترام به حریم خصوصی',
    description: 'اطلاعات شخصی منابع و مخاطبان محافظت می‌شود.',
  },
  {
    id: 'eth-4',
    title: 'شفافیت مالی',
    description: 'تبلیغات و حمایت‌های مالی به‌صورت شفاف اعلام می‌شوند.',
  },
  {
    id: 'eth-5',
    title: 'پاسخگویی',
    description: 'در صورت خطا، اصلاحیه فوری منتشر می‌شود.',
  },
];

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  page: {
    eyebrow: 'شناخت وارگه',
    title: 'درباره ما',
    description: 'تاریخچه، مأموریت و تیم تحریریه ماهنامه وارگه',
  },
  intro: {
    eyebrow: 'شناخت ماهنامه',
    title: 'درباره ماهنامه وارگه',
    subtitle: 'پلتفرمی مستقل برای تحلیل، گزارش و نقد',
    body: 'ماهنامه وارگه با تیمی حرفه‌ای و متعهد، هر ماه محتوایی عمیق در حوزه‌های سیاست، اقتصاد، فرهنگ و فناوری ارائه می‌دهد — برای مخاطبی که به فهم دقیق‌تر جهان اطرافش اهمیت می‌دهد.',
    ctaLabel: 'بیشتر بدانید',
  },
  stats: {
    issueCount: 12,
    activeYears: 3,
    audienceCount: 45000,
    foundedYear: 1402,
  },
  mission: {
    title: 'مأموریت ما',
    body: 'ماهنامه وارگه با هدف ارائه تحلیل‌های عمیق، گزارش‌های مستند و نقدهای سازنده در حوزه‌های سیاست، اقتصاد، فرهنگ و فناوری تأسیس شده است. ما متعهد به بی‌طرفی، دقت در گزارش‌گری و احترام به حقوق مخاطب هستیم.',
  },
  history: {
    title: 'تاریخچه',
    body: 'ماهنامه در بهار ۱۴۰۲ با تیمی کوچک اما پرانگیزه آغاز به کار کرد. از یک نشریه دیجیتال کوچک تا امروز که بیش از ۴۵ هزار مخاطب فعال دارد، همواره بر کیفیت محتوا و استقلال تحریریه تأکید کرده‌ایم.',
  },
  milestones: DEFAULT_ABOUT_MILESTONES,
  team: {
    title: 'تیم تحریریه',
    subtitle: 'افرادی که هر ماه محتوای ماهنامه را می‌سازند',
    members: DEFAULT_ABOUT_TEAM,
  },
  ethics: {
    title: 'سیاست تحریریه و اخلاق حرفه‌ای',
    subtitle: 'اصولی که هویت تحریریه وارگه را شکل می‌دهند',
    items: DEFAULT_ABOUT_ETHICS,
  },
  cta: {
    title: 'همراه تحریریه شوید',
    description: 'برای ارسال مطلب، همکاری یا ارتباط مستقیم با تیم تحریریه آماده‌ایم.',
    primaryLabel: 'همکاری با ما',
    primaryHref: '/collaborate',
    secondaryLabel: 'تماس با ما',
    secondaryHref: '/contact',
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mergeTeamMember(raw: unknown, fallback: AboutTeamMember): AboutTeamMember {
  const row = asRecord(raw);
  const socialRaw = asRecord(row.social);
  return {
    id: asString(row.id, fallback.id),
    name: asString(row.name, fallback.name),
    role: asString(row.role, fallback.role),
    bio: asString(row.bio, fallback.bio),
    avatar: asString(row.avatar, fallback.avatar) || DEFAULT_AVATAR,
    social: {
      twitter: asString(socialRaw.twitter, fallback.social?.twitter ?? '') || undefined,
      instagram: asString(socialRaw.instagram, fallback.social?.instagram ?? '') || undefined,
      linkedin: asString(socialRaw.linkedin, fallback.social?.linkedin ?? '') || undefined,
      telegram: asString(socialRaw.telegram, fallback.social?.telegram ?? '') || undefined,
    },
    isActive: row.isActive === false ? false : true,
    sortOrder: asNumber(row.sortOrder, fallback.sortOrder ?? 0),
  };
}

export function mergeAboutContent(value: unknown): AboutContent {
  const input = asRecord(value);
  const page = asRecord(input.page);
  const intro = asRecord(input.intro);
  const stats = asRecord(input.stats);
  const mission = asRecord(input.mission);
  const history = asRecord(input.history);
  const team = asRecord(input.team);
  const ethics = asRecord(input.ethics);
  const cta = asRecord(input.cta);

  const milestones =
    Array.isArray(input.milestones) && input.milestones.length > 0
      ? input.milestones.map((item, index) => {
          const row = asRecord(item);
          const fallback = DEFAULT_ABOUT_MILESTONES[index] ?? DEFAULT_ABOUT_MILESTONES[0];
          return {
            id: asString(row.id, fallback.id),
            year: asString(row.year, fallback.year),
            title: asString(row.title, fallback.title),
            description: asString(row.description, fallback.description),
          };
        })
      : DEFAULT_ABOUT_MILESTONES;

  const members =
    Array.isArray(team.members) && team.members.length > 0
      ? team.members.map((item, index) =>
          mergeTeamMember(item, DEFAULT_ABOUT_TEAM[index] ?? DEFAULT_ABOUT_TEAM[0]),
        )
      : DEFAULT_ABOUT_TEAM;

  const ethicsItems =
    Array.isArray(ethics.items) && ethics.items.length > 0
      ? ethics.items.map((item, index) => {
          const row = asRecord(item);
          const fallback = DEFAULT_ABOUT_ETHICS[index] ?? DEFAULT_ABOUT_ETHICS[0];
          // Back-compat: allow plain strings from older mock shape
          if (typeof item === 'string') {
            return {
              id: `eth-legacy-${index + 1}`,
              title: item.split(':')[0]?.trim() || fallback.title,
              description: item.includes(':') ? item.split(':').slice(1).join(':').trim() : item,
            };
          }
          return {
            id: asString(row.id, fallback.id),
            title: asString(row.title, fallback.title),
            description: asString(row.description, fallback.description),
          };
        })
      : DEFAULT_ABOUT_ETHICS;

  return {
    page: {
      eyebrow: asString(page.eyebrow, DEFAULT_ABOUT_CONTENT.page.eyebrow),
      title: asString(page.title, DEFAULT_ABOUT_CONTENT.page.title),
      description: asString(page.description, DEFAULT_ABOUT_CONTENT.page.description),
    },
    intro: {
      eyebrow: asString(intro.eyebrow, DEFAULT_ABOUT_CONTENT.intro.eyebrow),
      title: asString(intro.title, DEFAULT_ABOUT_CONTENT.intro.title),
      subtitle: asString(intro.subtitle, DEFAULT_ABOUT_CONTENT.intro.subtitle),
      body: asString(intro.body, DEFAULT_ABOUT_CONTENT.intro.body),
      ctaLabel: asString(intro.ctaLabel, DEFAULT_ABOUT_CONTENT.intro.ctaLabel),
    },
    stats: {
      issueCount: asNumber(stats.issueCount, DEFAULT_ABOUT_CONTENT.stats.issueCount),
      activeYears: asNumber(stats.activeYears, DEFAULT_ABOUT_CONTENT.stats.activeYears),
      audienceCount: asNumber(stats.audienceCount, DEFAULT_ABOUT_CONTENT.stats.audienceCount),
      foundedYear: asNumber(stats.foundedYear, DEFAULT_ABOUT_CONTENT.stats.foundedYear),
    },
    mission: {
      title: asString(mission.title, DEFAULT_ABOUT_CONTENT.mission.title),
      body: asString(mission.body, DEFAULT_ABOUT_CONTENT.mission.body),
    },
    history: {
      title: asString(history.title, DEFAULT_ABOUT_CONTENT.history.title),
      body: asString(history.body, DEFAULT_ABOUT_CONTENT.history.body),
    },
    milestones,
    team: {
      title: asString(team.title, DEFAULT_ABOUT_CONTENT.team.title),
      subtitle: asString(team.subtitle, DEFAULT_ABOUT_CONTENT.team.subtitle),
      members,
    },
    ethics: {
      title: asString(ethics.title, DEFAULT_ABOUT_CONTENT.ethics.title),
      subtitle: asString(ethics.subtitle, DEFAULT_ABOUT_CONTENT.ethics.subtitle),
      items: ethicsItems,
    },
    cta: {
      title: asString(cta.title, DEFAULT_ABOUT_CONTENT.cta.title),
      description: asString(cta.description, DEFAULT_ABOUT_CONTENT.cta.description),
      primaryLabel: asString(cta.primaryLabel, DEFAULT_ABOUT_CONTENT.cta.primaryLabel),
      primaryHref: asString(cta.primaryHref, DEFAULT_ABOUT_CONTENT.cta.primaryHref),
      secondaryLabel: asString(cta.secondaryLabel, DEFAULT_ABOUT_CONTENT.cta.secondaryLabel),
      secondaryHref: asString(cta.secondaryHref, DEFAULT_ABOUT_CONTENT.cta.secondaryHref),
    },
  };
}

export function getActiveTeamMembers(members: AboutTeamMember[]): AboutTeamMember[] {
  return [...members]
    .filter((member) => member.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
