import type { AdPricing, AdPortfolio } from '../types';
import { mockImages } from './images';

export const adPricing: AdPricing[] = [
  {
    id: 'ad-1',
    type: 'print',
    name: 'صفحه کامل',
    size: 'A4 تمام‌صفحه',
    price: 15000000,
    description: 'تبلیغ تمام‌صفحه در شماره چاپی ماهنامه',
  },
  {
    id: 'ad-2',
    type: 'print',
    name: 'نیم‌صفحه',
    size: 'A4 نیم‌صفحه',
    price: 9000000,
    description: 'تبلیغ نیم‌صفحه عمودی یا افقی',
  },
  {
    id: 'ad-3',
    type: 'print',
    name: 'ربع‌صفحه',
    size: 'A4 ربع‌صفحه',
    price: 5000000,
    description: 'مناسب برای آگهی‌های کوچک',
  },
  {
    id: 'ad-4',
    type: 'digital',
    name: 'بنر اصلی',
    size: '728×90',
    price: 8000000,
    description: 'بنر بالای صفحه اصلی وب‌سایت — یک ماه',
  },
  {
    id: 'ad-5',
    type: 'digital',
    name: 'اسپانسر مقاله',
    size: 'درون متن',
    price: 6000000,
    description: 'اسپانسری یک مقاله ویژه',
  },
  {
    id: 'ad-6',
    type: 'digital',
    name: 'خبرنامه',
    size: 'بنر ایمیل',
    price: 4000000,
    description: 'تبلیغ در خبرنامه هفتگی',
  },
];

export const adPortfolio: AdPortfolio[] = [
  {
    id: 'port-1',
    title: 'کمپین بهار ۱۴۰۵',
    client: 'شرکت فناوری آلفا',
    image: mockImages.ad,
    type: 'digital',
  },
  {
    id: 'port-2',
    title: 'تبلیغ شماره ۱۰',
    client: 'بانک ملی',
    image: mockImages.ad,
    type: 'print',
  },
  {
    id: 'port-3',
    title: 'اسپانسری ویژه',
    client: 'استارتاپ بتا',
    image: mockImages.ad,
    type: 'digital',
  },
];
