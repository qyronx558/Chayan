import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Award,
  IdCard,
  KeyRound,
  GraduationCap,
  BookOpen,
  Newspaper,
  FolderKanban,
  Landmark,
  Gift,
  Wallet,
  ShieldAlert,
  ClipboardCheck,
  Eye,
  Users,
  TrendingUp,
  BarChart3,
  BellRing,
  Clock,
  SlidersHorizontal,
  UploadCloud,
  Bot,
  Rss,
  ScrollText,
  MapPin,
} from "lucide-react";
import type { StaffRole } from "@/lib/admin/access";

export type BadgeKey = "scam" | "review";

export interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole: StaffRole;
  badgeKey?: BadgeKey;
  hint?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  defaultOpen: boolean;
  items: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    defaultOpen: true,
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, minRole: "ADMIN" }],
  },
  {
    key: "content",
    label: "Content",
    defaultOpen: true,
    items: [
      { label: "Gov jobs", href: "/admin/jobs", icon: Briefcase, minRole: "ADMIN" },
      { label: "Private jobs", href: "/admin/private-jobs", icon: Building2, minRole: "ADMIN" },
      { label: "Results", href: "/admin/results", icon: Award, minRole: "ADMIN" },
      { label: "Admit cards", href: "/admin/admit-cards", icon: IdCard, minRole: "ADMIN" },
      { label: "Answer keys", href: "/admin/answer-keys", icon: KeyRound, minRole: "ADMIN" },
      { label: "Admissions", href: "/admin/admissions", icon: GraduationCap, minRole: "ADMIN" },
      { label: "Syllabus", href: "/admin/syllabus", icon: BookOpen, minRole: "ADMIN" },
      { label: "Blog posts", href: "/admin/blog", icon: Newspaper, minRole: "ADMIN" },
      { label: "Categories", href: "/admin/categories", icon: FolderKanban, minRole: "SUPER_ADMIN" },
      { label: "Departments", href: "/admin/departments", icon: Landmark, minRole: "SUPER_ADMIN" },
      { label: "Locations", href: "/admin/locations", icon: MapPin, minRole: "SUPER_ADMIN" },
    ],
  },
  {
    key: "manage",
    label: "Manage",
    defaultOpen: false,
    items: [
      { label: "Referrals", href: "/admin/referrals", icon: Gift, minRole: "SUPER_ADMIN" },
      { label: "Referral payouts", href: "/admin/referral-payouts", icon: Wallet, minRole: "SUPER_ADMIN" },
      { label: "Scam reports", href: "/admin/reports", icon: ShieldAlert, minRole: "SUPER_ADMIN", badgeKey: "scam" },
      { label: "Content verification", href: "/admin/review", icon: ClipboardCheck, minRole: "SUPER_ADMIN", badgeKey: "review" },
      { label: "Admin uploads", href: "/admin/uploads", icon: Eye, minRole: "SUPER_ADMIN", hint: "View only" },
      { label: "Users and roles", href: "/admin/users", icon: Users, minRole: "SUPER_ADMIN" },
      { label: "Team performance", href: "/admin/team", icon: TrendingUp, minRole: "SUPER_ADMIN" },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, minRole: "SUPER_ADMIN" },
      { label: "Notifications", href: "/admin/notifications", icon: BellRing, minRole: "ADMIN" },
      { label: "Expiring soon", href: "/admin/expiring", icon: Clock, minRole: "ADMIN" },
      { label: "Featured slider", href: "/admin/featured-slider", icon: SlidersHorizontal, minRole: "SUPER_ADMIN" },
    ],
  },
  {
    key: "system",
    label: "System",
    defaultOpen: false,
    items: [
      { label: "Bulk upload", href: "/admin/bulk-upload", icon: UploadCloud, minRole: "ADMIN" },
      { label: "Content bot", href: "/admin/content-bot", icon: Bot, minRole: "SUPER_ADMIN" },
      { label: "Job feeds", href: "/admin/job-feeds", icon: Rss, minRole: "SUPER_ADMIN" },
      { label: "Activity logs", href: "/admin/logs", icon: ScrollText, minRole: "ADMIN" },
    ],
  },
];

export function visibleGroups(role: StaffRole | null): { group: NavGroup; items: NavEntry[] }[] {
  if (!role) return [];
  const rank = role === "SUPER_ADMIN" ? 2 : 1;
  const out: { group: NavGroup; items: NavEntry[] }[] = [];
  for (const group of NAV_GROUPS) {
    const items = group.items.filter((i) => (i.minRole === "SUPER_ADMIN" ? 2 : 1) <= rank);
    if (items.length > 0) out.push({ group, items });
  }
  return out;
}
