import {
  Home, Map, FolderOpen, BookOpen, ListChecks, User,
  LayoutDashboard, Users, Layers, FileText, PenLine, Inbox, Award, Settings,
  Headphones, Gift, MessageSquareHeart, Mic2, Gamepad2, Library, Brain, ClipboardCheck, BellRing,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem { path: string; label: string; ic: LucideIcon }

export const WA_LINK = 'https://wa.me/201091060951?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%B3%D8%A8%D9%8A%D9%83%D9%88%D8%B2%D9%8A';

export const studentNav: NavItem[] = [
  { path: '/', label: 'الرئيسية', ic: Home },
  { path: '/roadmap', label: 'خريطة المستويات', ic: Map },
  { path: '/materials', label: 'الماتيريال', ic: FolderOpen },
  { path: '/dictionary', label: 'الديكشنري', ic: BookOpen },
  { path: '/words', label: 'الكلمات', ic: Brain },
  { path: '/yalla-netkellem', label: 'يلا نتكلم', ic: Mic2 },
  { path: '/tasks', label: 'التاسكات اليومية', ic: ListChecks },
  { path: '/shadowing', label: 'الشادوينج', ic: Headphones },
  { path: '/play', label: 'العب واتعلم', ic: Gamepad2 },
  { path: '/resources', label: 'المصادر', ic: Library },
  { path: '/trial', label: 'تجربة مجانية', ic: Gift },
  { path: '/testimonials', label: 'آراء طلابنا', ic: MessageSquareHeart },
  { path: '/profile', label: 'البروفايل', ic: User },
];

export const adminNav: NavItem[] = [
  { path: '/admin', label: 'نظرة عامة', ic: LayoutDashboard },
  { path: '/admin/students', label: 'الطلاب', ic: Users },
  { path: '/admin/curriculum', label: 'المستويات والجلسات', ic: Layers },
  { path: '/admin/content', label: 'المحتوى', ic: FileText },
  { path: '/admin/lesson', label: 'تعديل السيشنات', ic: PenLine },
  { path: '/admin/reviews', label: 'مراجعة النتائج', ic: Inbox },
  { path: '/admin/task-reviews', label: 'مراجعة التاسكات', ic: ClipboardCheck },
  { path: '/admin/operations', label: 'التاسكات والإشعارات', ic: BellRing },
  { path: '/admin/listen', label: 'كليبات الشادوينج', ic: Headphones },
  { path: '/admin/pdfs', label: 'ملفات PDF', ic: FileText },
  { path: '/admin/certificates', label: 'الشهادات', ic: Award },
  { path: '/admin/settings', label: 'الإعدادات', ic: Settings },
];

/** Student links shown as pills in the desktop header; everything else goes under "المزيد". */
export const STUDENT_PRIMARY = ['/', '/roadmap', '/words', '/shadowing', '/tasks'];

const SHORT_LABELS: Record<string, string> = {
  'خريطة المستويات': 'المستويات', 'تجربة مجانية': 'تجربة', 'آراء طلابنا': 'آراء',
  'المستويات والجلسات': 'المستويات', 'استوديو الجرامر': 'الجرامر', 'تعديل السيشنات': 'السيشنات',
  'مراجعة النتائج': 'المراجعة', 'التاسكات والإشعارات': 'التاسكات', 'التاسكات اليومية': 'التاسكات',
  'يلا نتكلم': 'نتكلم', 'العب واتعلم': 'العب',
};
export const shortLabel = (label: string) => SHORT_LABELS[label] || label.split(' ')[0];

export const isActivePath = (current: string, path: string) => (path === '/' ? current === '/' : current.startsWith(path));
