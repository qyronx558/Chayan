"use client"

import { useState } from "react"
import { RichEditor } from "@/components/admin/RichEditor"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BLOG_PROSE_CLASSES, containsHtml, renderRichHtml } from "@/lib/blog-prose"
import { cn } from "@/lib/utils"
import { Eye, Code2, PenLine, FileText } from "lucide-react"

interface SmartContentFieldProps {
  value: string | null | undefined
  onChange: (v: string | null) => void
  placeholder?: string
  htmlPlaceholder?: string
  rows?: number
}

/**
 * Unified plain-text + HTML/CSS field.
 * - Visual: TipTap RichEditor (existing, unchanged behaviour)
 * - HTML/CSS: raw paste area (monospace) for styled documents
 * - Preview: clean client-side render via renderRichHtml + BLOG_PROSE_CLASSES
 *   (identical pipeline to RichTextView / public detail pages).
 * Plain text without tags renders as-is downstream, so both modes stay clean.
 */
const hasCustomCss = (text: string): boolean => /<style[\s>]/i.test(text)

export function SmartContentField({
  value,
  onChange,
  placeholder = "Write plain text, or switch to HTML/CSS to paste styled content...",
  htmlPlaceholder = "Paste HTML here — <style> blocks, tables, section-blocks are supported and will be scoped on preview...",
  rows = 8,
}: SmartContentFieldProps) {
  const text = value ?? ""
  // Pasted styled documents open on the HTML tab so TipTap never gets a
  // chance to normalize (and silently drop) the custom CSS on mount.
  const [mode, setMode] = useState<"visual" | "html" | "preview">(() =>
    hasCustomCss(text) ? "html" : "visual"
  )
  const isHtml = containsHtml(text)
  const styled = hasCustomCss(text)
  const len = text.length

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
          <TabsList className="h-8 bg-white p-0.5 shadow-sm dark:bg-gray-800">
            <TabsTrigger value="visual" className="h-7 gap-1.5 px-3 text-xs">
              <PenLine className="h-3.5 w-3.5" /> Visual
            </TabsTrigger>
            <TabsTrigger value="html" className="h-7 gap-1.5 px-3 text-xs">
              <Code2 className="h-3.5 w-3.5" /> HTML / CSS
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 gap-1.5 px-3 text-xs">
              <Eye className="h-3.5 w-3.5" /> Preview
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isHtml ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              )}
            >
              <FileText className="h-3 w-3" />
              {isHtml ? "Styled HTML detected" : "Plain text"}
            </span>
            <span className="text-[11px] tabular-nums text-gray-400">{len} chars</span>
          </div>
        </div>

        <TabsContent value="visual" className="m-0">
          {styled && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              This content contains custom <code>&lt;style&gt;</code> CSS, shown styled in Preview and on the public
              page. Viewing it here is safe, but <strong>typing any edit in Visual will re-save without the custom
              styles</strong> — keep style changes in the HTML / CSS tab.
            </div>
          )}
          <div className="[&_>div]:!rounded-none [&_>div]:!border-0">
            <RichEditor
              value={text}
              onChange={(html) => onChange(html || null)}
              placeholder={placeholder}
            />
          </div>
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <div className="p-3">
            <Textarea
              value={text}
              onChange={(e) => onChange(e.target.value || null)}
              rows={rows}
              placeholder={htmlPlaceholder}
              className="min-h-[220px] font-mono text-[13px] leading-relaxed"
              spellCheck={false}
            />
            <p className="mt-2 text-xs text-gray-500">
              Tip: paste a full styled document including <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">&lt;style&gt;</code> blocks -
              styles are auto-scoped to the content area on preview and on the public page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="max-h-[380px] min-h-[180px] overflow-y-auto bg-white p-5 dark:bg-gray-900">
            {text.trim() ? (
              isHtml ? (
                <div
                  className={BLOG_PROSE_CLASSES}
                  dangerouslySetInnerHTML={{ __html: renderRichHtml(text) }}
                />
              ) : (
                <p className="whitespace-pre-line text-sm leading-7 text-gray-700 dark:text-gray-300">{text}</p>
              )
            ) : (
              <p className="text-sm text-gray-400">Nothing to preview yet - write content or paste HTML first.</p>
            )}
          </div>
          <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-900/50">
            Live preview uses the exact public-page renderer, so what you see here is what readers see.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
