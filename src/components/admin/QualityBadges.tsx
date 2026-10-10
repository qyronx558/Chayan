"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Link2Off, CalendarClock } from "lucide-react";
import { isExpiredRow, isExpiringSoon, isProbablyBrokenUrl, missingFieldsScore } from "@/lib/admin/permissions";

interface QualityBadgesProps {
  row: Record<string, unknown>;
  required?: string[];
  linkKeys?: string[];
}

/** SaaS quality signals: expired mismatch, expiring soon, broken links, missing fields. */
export function QualityBadges({ row, required = ["title", "slug"], linkKeys = ["applyLink", "officialWebsite", "pdfUrl", "downloadUrl"] }: QualityBadgesProps) {
  const lastDate = (row.lastDate as string | null | undefined) ?? null;
  const status = (row.status as string | null | undefined) ?? null;
  const missing = missingFieldsScore(row, required);
  const broken = linkKeys.filter((k) => isProbablyBrokenUrl(row[k] as string | null | undefined));

  if (!isExpiredRow(lastDate, status) && !isExpiringSoon(lastDate) && missing.length === 0 && broken.length === 0) {
    return null;
  }

  return (
    <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-middle">
      {isExpiredRow(lastDate, status) && (
        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
          <CalendarClock className="mr-0.5 h-3 w-3" /> past last-date
        </Badge>
      )}
      {!isExpiredRow(lastDate, status) && isExpiringSoon(lastDate) && (
        <Badge className="h-5 bg-amber-500 px-1.5 text-[10px] text-white hover:bg-amber-500">
          expiring soon
        </Badge>
      )}
      {broken.length > 0 && (
        <Badge variant="outline" className="h-5 border-amber-300 px-1.5 text-[10px] text-amber-700" title={`Check: ${broken.join(", ")}`}>
          <Link2Off className="mr-0.5 h-3 w-3" /> link?
        </Badge>
      )}
      {missing.length > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]" title={`Missing: ${missing.join(", ")}`}>
          <AlertTriangle className="mr-0.5 h-3 w-3" /> {missing.length} missing
        </Badge>
      )}
    </span>
  );
}
