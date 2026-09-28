"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Timer,
  Users,
  CalendarClock,
  Wallet,
  UserRound,
  GraduationCap,
  Share2,
  BadgeCheck,
  ArrowUpRight,
  ImageDown,
  Download,
  ExternalLink,
  Link2,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { stripHtmlToText } from "@/lib/blog-prose";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  title: string; department: string; slug: string;
  totalVacancies: number | null; lastDate: string | null;
  applicationFee: string | null; ageLimit: string | null; education: string | null;
}

/** Strip any HTML / <style> / entities down to clean readable plain text. */
function clean(value: string | null | undefined, max = 160): string {
  if (!value) return "";
  const text = stripHtmlToText(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function WhatsAppIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function JobQuickSummary(p: Props) {
  const [pageUrl, setPageUrl] = useState("");
  const [posterOpen, setPosterOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);
  }, []);

  const lastDateObj = p.lastDate ? new Date(p.lastDate) : null;
  const validDate = lastDateObj && !isNaN(lastDateObj.getTime()) ? lastDateObj : null;
  const daysLeft = validDate ? Math.ceil((validDate.getTime() - Date.now()) / 86400000) : null;
  const formattedLastDate = validDate ? formatDate(validDate) : "";

  const feeText = clean(p.applicationFee, 140);
  const ageText = clean(p.ageLimit, 80);
  const educationText = clean(p.education, 160);

  const ogParams = new URLSearchParams({
    v: "2",
    title: p.title,
    dept: p.department,
    meta:
      daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
        ? `Only ${daysLeft}d left`
        : daysLeft !== null && daysLeft > 7
          ? `${daysLeft} days left`
          : "Apply now",
    ...(p.totalVacancies ? { vacancies: p.totalVacancies.toLocaleString("en-IN") } : {}),
    ...(formattedLastDate ? { lastDate: formattedLastDate } : {}),
  });
  const og = `/api/og/job?${ogParams.toString()}`;
  const waText = encodeURIComponent(
    `New vacancy: ${p.title} (${p.department})${p.totalVacancies ? `\n${p.totalVacancies} posts` : ""}${formattedLastDate ? `\nLast date: ${formattedLastDate}` : ""}\nFull details here:\n${pageUrl}`,
  );
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(p.title)}`;

  const posterFileName = `${p.slug || "job"}-poster.png`;

  const handlePosterDownload = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      const res = await fetch(og);
      if (!res.ok) throw new Error(`Poster request failed (${res.status})`);
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Poster did not return an image");
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = posterFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch {
      setDownloadError("Download failed - try opening the full image instead.");
      window.open(og, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPosterLink = async () => {
    try {
      const absolute = pageUrl ? new URL(og, window.location.origin).toString() : og;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setDownloadError("Could not copy link.");
    }
  };

  const rows = [
    ...(p.totalVacancies
      ? [{ icon: Users, label: "Vacancies", value: `${p.totalVacancies.toLocaleString("en-IN")} posts` }]
      : []),
    ...(formattedLastDate
      ? [{
          icon: CalendarClock,
          label: "Last date to apply",
          value: formattedLastDate,
          extra:
            daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900">
                Only {daysLeft}d left
              </span>
            ) : daysLeft !== null && daysLeft > 7 ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
                {daysLeft}d left
              </span>
            ) : null,
        }]
      : []),
    ...(feeText ? [{ icon: Wallet, label: "Application fee", value: feeText }] : []),
    ...(ageText ? [{ icon: UserRound, label: "Age limit", value: ageText }] : []),
    ...(educationText ? [{ icon: GraduationCap, label: "Qualification", value: educationText }] : []),
  ];

  if (rows.length === 0) return null;

  return (
    <section
      aria-label="Quick summary"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900"
    >
      {/* calm header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Timer className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
            2-minute summary
          </h2>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Key points from the official notification
          </p>
        </div>
        <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 sm:inline-flex dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>
      </div>

      {/* key facts */}
      <ul className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3 py-3">
            <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {row.label}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {row.value}
                {row.extra}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* helpful next steps - quiet text links, not loud buttons */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[13px] dark:border-slate-800 dark:bg-slate-800/40">
        {ageText && (
          <Link href="/tools/age-calculator" className="inline-flex items-center gap-1 text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white">
            Check my age <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {educationText && (
          <Link href="/tools/eligibility-checker" className="inline-flex items-center gap-1 text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white">
            Am I eligible? <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
        <Link href="/tools/salary-calculator" className="inline-flex items-center gap-1 text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white">
          Calculate in-hand salary <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* share */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Share2 className="h-3.5 w-3.5" /> Share
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#1faa55]/40 hover:bg-[#1faa55]/5 hover:text-[#147a3e] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1faa55]/40 dark:hover:text-[#4ade80]"
          >
            <span className="text-[#1faa55]"><WhatsAppIcon /></span>
            WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Telegram"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#229ED9]/40 hover:bg-[#229ED9]/5 hover:text-[#0e6ea8] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#229ED9]/40 dark:hover:text-[#38bdf8]"
          >
            <span className="text-[#229ED9]"><TelegramIcon /></span>
            Telegram
          </a>
          <button
            type="button"
            onClick={() => setPosterOpen(true)}
            aria-label="Preview job poster"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ImageDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            Poster
          </button>
        </div>
      </div>

      {/* poster preview + download */}
      <Dialog open={posterOpen} onOpenChange={setPosterOpen}>
        <DialogContent className="max-w-xl dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Job poster</DialogTitle>
            <DialogDescription>
              Preview, download and share this job as an image.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={og}
              alt={`${p.title} - job poster`}
              width={1200}
              height={630}
              className="h-auto w-full"
              loading="lazy"
            />
          </div>
          {downloadError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{downloadError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePosterDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Preparing…" : "Download PNG"}
            </button>
            <a
              href={og}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open full image
            </a>
            <button
              type="button"
              onClick={handleCopyPosterLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy image link"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
