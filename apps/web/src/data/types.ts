export type Category = {
  id: string;
  slug: string;
  name: string;
  parentId?: string;
  children?: Category[];
};

export type Author = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  tagIds: string[];
  authorId: string;
  authorName?: string;
  issueId?: string;
  publishedAt: string;
  readingTimeMinutes: number;
  isEditorsPick?: boolean;
  isFeatured?: boolean;
};

export type Issue = {
  id: string;
  slug: string;
  number: number;
  title: string;
  coverImage: string;
  publishedAt: string;
  pageCount: number;
  pdfUrl: string;
  description: string;
  articleIds: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  social?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};

export type AdPricing = {
  id: string;
  type: 'print' | 'digital';
  name: string;
  size: string;
  price: number;
  description: string;
};

export type AdPortfolio = {
  id: string;
  title: string;
  client: string;
  image: string;
  type: 'print' | 'digital';
};

export type SubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  type: 'digital' | 'print' | 'combo';
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
};

export type Comment = {
  id: string;
  articleId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type MagazineStats = {
  issueCount: number;
  activeYears: number;
  audienceCount: number;
  foundedYear: number;
};

export type JobOpening = {
  id: string;
  title: string;
  type: 'freelance' | 'fulltime';
  description: string;
  deadline: string;
};
