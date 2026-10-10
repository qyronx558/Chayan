"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { staffRole } from "@/lib/admin/access"
import { initials } from "@/components/admin/list/tokens"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { NAV_GROUPS, visibleGroups, type BadgeKey, type NavEntry } from "./sidebar-config"

interface SidebarCounts {
  scamReports: number;
  needsReview: number;
}

function readRail(userId: string): boolean {
  try {
    return window.localStorage.getItem(`admin:nav-rail:${userId}`) === "1";
  } catch {
    return false;
  }
}

function readGroups(userId: string): Record<string, boolean> {
  const fallback: Record<string, boolean> = {};
  for (const g of NAV_GROUPS) fallback[g.key] = g.defaultOpen;
  try {
    const raw = window.localStorage.getItem(`admin:nav-open:${userId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0b1220]";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-amber-100 px-1.5 py-px text-[11px] font-bold tabular-nums text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItem({
  entry,
  active,
  rail,
  badge,
  onNavigate,
}: {
  entry: NavEntry;
  active: boolean;
  rail: boolean;
  badge: number;
  onNavigate: () => void;
}) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      title={entry.hint ? `${entry.label} - ${entry.hint}` : entry.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-[34px] items-center gap-2.5 rounded-lg px-2 text-[13px] transition-colors",
        rail && "justify-center px-0",
        active
          ? "bg-teal-50 font-medium text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
          : "font-normal text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-100",
        FOCUS_RING
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {!rail && <span className="whitespace-nowrap">{entry.label}</span>}
      {!rail && badge > 0 && (
        <span className="ml-auto">
          <CountBadge count={badge} />
        </span>
      )}
      {rail && badge > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0b1220]" aria-hidden="true" />
      )}
    </Link>
  );
}

interface BodyProps {
  rail: boolean;
  onToggleRail: () => void;
  onNavigate: () => void;
}

function SidebarBody({ rail, onToggleRail, onNavigate }: BodyProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = staffRole(session?.user?.role);
  const userId = session?.user?.id ?? "anon";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => readGroups(userId));

  useEffect(() => {
    setOpenGroups(readGroups(userId));
  }, [userId]);

  const persistGroups = (next: Record<string, boolean>) => {
    setOpenGroups(next);
    try {
      window.localStorage.setItem(`admin:nav-open:${userId}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const groups = visibleGroups(role);

  const { data: counts } = useQuery<{ success: boolean; data: SidebarCounts }>({
    queryKey: ["sidebar-counts"],
    queryFn: () => fetcher("/api/admin/sidebar-counts"),
    enabled: role === "SUPER_ADMIN",
    refetchInterval: 60000,
    staleTime: 60000,
  });

  const badgeFor = (key?: BadgeKey): number => {
    if (!key || !counts?.data) return 0;
    return key === "scam" ? counts.data.scamReports : counts.data.needsReview;
  };

  useEffect(() => {
    for (const { group, items } of groups) {
      const containsActive = items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
      if (containsActive) {
        setOpenGroups((prev) => (prev[group.key] ? prev : { ...prev, [group.key]: true }));
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isSuper = role === "SUPER_ADMIN";

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex shrink-0 items-center gap-2.5 border-b border-slate-200/80 px-4 dark:border-white/[0.06]", rail ? "h-auto flex-col py-3" : "h-16")}>
        <Link
          href="/admin/dashboard"
          title="ChayanJobs admin home"
          onClick={onNavigate}
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm", FOCUS_RING)}
        >
          <svg viewBox="0 0 80 80" className="h-5 w-5" aria-hidden="true">
            <path d="M20 48 L30 58 L55 28" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {!rail && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-bold text-slate-900 dark:text-white">ChayanJobs</p>
            <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">Admin console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRail}
          title={rail ? "Expand sidebar" : "Collapse to icon rail"}
          aria-label={rail ? "Expand sidebar" : "Collapse to icon rail"}
          className={cn("hidden h-8 w-8 shrink-0 text-slate-400 hover:text-slate-700 lg:flex dark:hover:text-slate-200", rail && "mt-1")}
        >
          {rail ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onNavigate} aria-label="Close menu" className="h-8 w-8 shrink-0 lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav aria-label="Admin navigation" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 py-3 [scrollbar-width:thin]">
        {groups.map(({ group, items }) => {
          const open = rail ? true : (openGroups[group.key] ?? group.defaultOpen);
          const closedSum = items.reduce((s, i) => s + badgeFor(i.badgeKey), 0);
          return (
            <div key={group.key}>
              {!rail && (
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => persistGroups({ ...openGroups, [group.key]: !open })}
                  className={cn(
                    "mb-1 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                    FOCUS_RING
                  )}
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
                  {group.label}
                  {!open && closedSum > 0 && (
                    <span className="ml-auto">
                      <CountBadge count={closedSum} />
                    </span>
                  )}
                </button>
              )}
              {rail && <div className="mx-2 mb-2 border-t border-slate-200/70 first:hidden dark:border-white/[0.06]" aria-hidden="true" />}
              {(rail || open) && (
                <div className="space-y-0.5">
                  {items.map((entry) => {
                    const active = pathname === entry.href || pathname.startsWith(entry.href + "/");
                    return (
                      <NavItem
                        key={entry.href}
                        entry={entry}
                        active={active}
                        rail={rail}
                        badge={badgeFor(entry.badgeKey)}
                        onNavigate={onNavigate}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200/80 p-2.5 dark:border-white/[0.06]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={session?.user?.email ?? "Account"}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.05]",
                rail && "justify-center",
                FOCUS_RING
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-white/10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
                <AvatarFallback className="bg-teal-700 text-[11px] font-bold text-white">
                  {initials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
              {!rail && (
                <>
                  <span className="min-w-0 flex-1 text-left leading-tight">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {session?.user?.name || "Admin"}
                      </span>
                      <span
                        className={cn(
                          "h-4 shrink-0 rounded px-1 text-[9px] font-bold uppercase tracking-wide",
                          isSuper
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                        )}
                      >
                        {isSuper ? "Super" : "Admin"}
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">{session?.user?.email || ""}</span>
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold">{session?.user?.name || "Admin"}</p>
              <p className="truncate text-xs font-normal text-slate-400">{session?.user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" onClick={onNavigate} className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "anon";
  const [rail, setRail] = useState<boolean>(() => readRail(userId));

  useEffect(() => {
    setRail(readRail(userId));
  }, [userId]);

  const toggleRail = () => {
    setRail((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(`admin:nav-rail:${userId}`, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const close = () => onClose();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-white shadow-2xl lg:hidden dark:bg-[#0b1220]"
          >
            <SidebarBody rail={false} onToggleRail={toggleRail} onNavigate={close} />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "relative hidden h-full shrink-0 self-stretch flex-col overflow-hidden border-r border-slate-200/80 bg-white transition-[width] duration-200 lg:flex dark:border-white/[0.06] dark:bg-[#0b1220]",
          rail ? "w-16" : "w-[264px]"
        )}
      >
        <SidebarBody rail={rail} onToggleRail={toggleRail} onNavigate={() => undefined} />
      </aside>
    </>
  );
}
