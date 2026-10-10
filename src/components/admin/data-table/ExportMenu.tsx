"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Braces } from "lucide-react";
import { exportToCsv, flattenForCsv } from "@/lib/admin-export";

interface ExportMenuProps {
  rows: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
  variant?: "outline" | "secondary";
}

export function ExportMenu({ rows, filename, disabled, variant = "outline" }: ExportMenuProps) {
  const [busy, setBusy] = useState(false);

  const doCsv = () => {
    exportToCsv(rows.map(flattenForCsv), filename);
  };

  const doJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doXlsx = async () => {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const flat = rows.map(flattenForCsv);
      const ws = XLSX.utils.json_to_sheet(flat);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "export");
      XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant={variant} disabled={disabled || rows.length === 0 || busy}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {busy ? "Preparing…" : `Export (${rows.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={doCsv}>
          <FileText className="mr-2 h-4 w-4" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={doXlsx}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={doJson}>
          <Braces className="mr-2 h-4 w-4" /> JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
