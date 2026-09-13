import type { Author } from '../types';
import { mockImages } from './images';

export const authors: Author[] = [
  {
    id: 'author-1',
    name: 'مریم احمدی',
    avatar: mockImages.avatar,
    bio: 'روزنامه‌نگار و تحلیل‌گر مسائل سیاسی با بیش از ۱۵ سال سابقه.',
    social: { twitter: '#', instagram: '#', linkedin: '#' },
  },
  {
    id: 'author-2',
    name: 'علی رضایی',
    avatar: mockImages.avatar,
    bio: 'نویسنده و پژوهشگر حوزه اقتصاد و فناوری.',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    id: 'author-3',
    name: 'سارا محمدی',
    avatar: mockImages.avatar,
    bio: 'منتقد فرهنگی و سردبیر بخش هنر.',
    social: { instagram: '#', linkedin: '#' },
  },
  {
    id: 'author-4',
    name: 'رضا کریمی',
    avatar: mockImages.avatar,
    bio: 'خبرنگار و گزارشگر اختصاصی.',
    social: { twitter: '#' },
  },
];

export function getAuthorById(id: string) {
  return authors.find((a) => a.id === id);
}
