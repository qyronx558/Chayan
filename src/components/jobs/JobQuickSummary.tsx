"use client";
import Link from "next/link";
import { Zap, Share2, BadgeCheck, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/tools/ToolShell";

interface Props {
  title: string; department: string; slug: string;
  totalVacancies: number | null; lastDate: string | null;
  applicationFee: string | null; ageLimit: string | null; education: string | null;
}

export function JobQuickSummary(p: Props) {
  const daysLeft = p.lastDate ? Math.ceil((new Date(p.lastDate).getTime() - Date.now()) / 86400000) : null;
  const og = `/api/og/job?title=${encodeURIComponent(p.title)}&dept=${encodeURIComponent(p.department)}&meta=${encodeURIComponent(p.totalVacancies ? `${p.totalVacancies} posts` : daysLeft !== null ? `${daysLeft} days left` : "Apply now")}`;
  const waText = encodeURIComponent(`New vacancy: ${p.title} (${p.department})\n${p.totalVacancies ? `${p.totalVacancies} posts\n` : ""}${p.lastDate ? `Last date: ${p.lastDate}\n` : ""}Full details here:\n${typeof window !== "undefined" ? window.location.href : ""}`);

  return (
    <Card className="overflow-hidden border border-[#c3d4e2] dark:border-[#27445c]">
      <div className="flex items-center gap-2 bg-[#e7eef4] px-4 py-2.5 dark:bg-[#16232f]">
        <Zap className="h-4 w-4 text-[#4a7396] dark:text-[#93b4cc]" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">2-minute summary - read this first</p>
        <span className="ml-auto hidden rounded-full border border-[#c3d4e2] bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 sm:inline dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">TL;DR - verified from notification</span>
      </div>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {p.totalVacancies ? <p><b>{p.totalVacancies.toLocaleString("en-IN")} vacancies</b></p> : null}
          {p.lastDate ? (
            <p className="flex items-center gap-2"><Timer className="h-4 w-4 text-slate-500" /> Last date: <b>{p.lastDate}</b>
              {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? <StatusPill tone="bad">Only {daysLeft}d left</StatusPill> : daysLeft !== null && daysLeft > 7 ? <StatusPill tone="ok">{daysLeft}d left</StatusPill> : null}
            </p>
          ) : null}
          {p.applicationFee ? <p>Fee: <span className="text-slate-600 dark:text-slate-400">{p.applicationFee.replace(/<[^>]*>/g, "").slice(0, 120)}</span></p> : null}
          {p.ageLimit ? <p>Age: <b>{p.ageLimit}</b> <Link href="/tools/age-calculator" className="text-slate-700 underline dark:text-slate-300">check my age</Link></p> : null}
          {p.education ? <p><span className="text-slate-600 dark:text-slate-400">{p.education.replace(/<[^>]*>/g, "").slice(0, 140)}</span> <Link href="/tools/eligibility-checker" className="font-medium text-slate-800 underline dark:text-slate-200">am I eligible?</Link></p> : null}
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500"><Share2 className="h-3.5 w-3.5" /> Share with a friend</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-[#3f7a5e] hover:bg-[#35694f]" asChild>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener noreferrer">Telegram</a>
            </Button>
            <Button size="sm" variant="outline" asChild><a href={og} target="_blank" rel="noopener noreferrer">Poster image</a></Button>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate-500"><BadgeCheck className="h-3.5 w-3.5 text-slate-500" /> Salary confused? <Link href="/tools/salary-calculator" className="font-medium text-slate-700 underline dark:text-slate-300">calculate in-hand</Link></p>
        </div>
      </CardContent>
    </Card>
  );
}
