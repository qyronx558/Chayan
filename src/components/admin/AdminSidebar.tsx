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

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-1 ";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-paper-2 px-1.5 py-px text-[11px] font-bold tabular-nums text-brick dark:bg-paper-2 dark:text-brick">
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
          ? "bg-paper-3 font-medium text-brick dark:bg-paper-3 dark:text-brick"
          : "font-normal text-muted-foreground hover:bg-paper-3 hover:text-foreground dark:text-muted-foreground dark:hover:bg-background/[0.05] dark:hover:text-paper",
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
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brick ring-2 ring-background" aria-hidden="true" />
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
      <div className={cn("flex shrink-0 items-center gap-2.5 border-b border-rule/80 px-4 ", rail ? "h-auto flex-col py-3" : "h-16")}>
        <Link
          href="/admin/dashboard"
          title="ChayanJobs admin home"
          onClick={onNavigate}
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-3 text-paper ", FOCUS_RING)}
        >
          <svg viewBox="0 0 80 80" className="h-5 w-5" aria-hidden="true">
            <path d="M20 48 L30 58 L55 28" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {!rail && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-bold text-foreground dark:text-paper">ChayanJobs</p>
            <p className="truncate text-[11px] text-muted-foreground dark:text-muted-foreground">Admin console</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRail}
          title={rail ? "Expand sidebar" : "Collapse to icon rail"}
          aria-label={rail ? "Expand sidebar" : "Collapse to icon rail"}
          className={cn("hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground lg:flex dark:hover:text-muted-foreground", rail && "mt-1")}
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
                    "mb-1 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[10.5px] font-bold tracking-[0.12em] text-muted-foreground transition-colors hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground",
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
              {rail && <div className="mx-2 mb-2 border-t border-rule/70 first:hidden " aria-hidden="true" />}
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

      <div className="shrink-0 border-t border-rule/80 p-2.5 ">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={session?.user?.email ?? "Account"}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-paper-3 dark:hover:bg-background/[0.05]",
                rail && "justify-center",
                FOCUS_RING
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 border border-rule ">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "Admin"} />
                <AvatarFallback className="bg-paper-3 text-[11px] font-bold text-paper">
                  {initials(session?.user?.name, session?.user?.email)}
                </AvatarFallback>
              </Avatar>
              {!rail && (
                <>
                  <span className="min-w-0 flex-1 text-left leading-tight">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-semibold text-foreground dark:text-paper">
                        {session?.user?.name || "Admin"}
                      </span>
                      <span
                        className={cn(
                          "h-4 shrink-0 rounded px-1 text-[9px] font-bold ",
                          isSuper
                            ? "bg-paper-3 text-paper"
                            : "bg-paper-3 text-muted-foreground dark:bg-background/10 dark:text-muted-foreground"
                        )}
                      >
                        {isSuper ? "Super" : "Admin"}
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">{session?.user?.email || ""}</span>
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuLabel className="px-2.5 py-2">
              <p className="truncate text-[13px] font-semibold">{session?.user?.name || "Admin"}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" onClick={onNavigate} className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-brick focus:text-brick">
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
            className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
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
            className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-background  lg:hidden "
          >
            <SidebarBody rail={false} onToggleRail={toggleRail} onNavigate={close} />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "relative hidden h-full shrink-0 self-stretch flex-col overflow-hidden border-r border-rule/80 bg-background transition-[width] duration-200 lg:flex  ",
          rail ? "w-16" : "w-[264px]"
        )}
      >
        <SidebarBody rail={rail} onToggleRail={toggleRail} onNavigate={() => undefined} />
      </aside>
    </>
  );
}
