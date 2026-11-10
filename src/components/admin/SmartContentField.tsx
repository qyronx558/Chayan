"use client"

import { useState } from "react"
import { RichEditor } from "@/components/admin/RichEditor"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BLOG_PROSE_CLASSES, containsHtml } from "@/lib/blog-prose"
import { renderRichHtml } from "@/lib/rich-html"
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
  htmlPlaceholder = "Paste HTML here - <style> blocks, tables, section-blocks are supported and will be scoped on preview...",
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
    <div className="overflow-hidden rounded-xl border border-rule bg-background  dark:border-ink dark:bg-ink">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper-2/80 px-3 py-2 dark:border-ink dark:bg-ink/60">
          <TabsList className="h-8 bg-background p-0.5  dark:bg-ink">
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
                isHtml ? "bg-paper-3 text-brick dark:bg-paper-3 dark:text-brick" : "bg-paper-3 text-muted-foreground dark:bg-ink dark:text-muted-foreground"
              )}
            >
              <FileText className="h-3 w-3" />
              {isHtml ? "Styled HTML detected" : "Plain text"}
            </span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{len} chars</span>
          </div>
        </div>

        <TabsContent value="visual" className="m-0">
          {styled && (
            <div className="border-b border-rule bg-paper-2 px-4 py-2 text-xs leading-relaxed text-brick dark:border-rule dark:bg-paper-2 dark:text-brick">
              This content contains custom <code>&lt;style&gt;</code> CSS, shown styled in Preview and on the public
              page. Viewing it here is safe, but <strong>typing any edit in Visual will re-save without the custom
              styles</strong> - keep style changes in the HTML / CSS tab.
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
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: paste a full styled document including <code className="rounded bg-paper-3 px-1 dark:bg-ink">&lt;style&gt;</code> blocks -
              styles are auto-scoped to the content area on preview and on the public page.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="max-h-[380px] min-h-[180px] overflow-y-auto bg-background p-5 dark:bg-ink">
            {text.trim() ? (
              isHtml ? (
                <div
                  className={BLOG_PROSE_CLASSES}
                  dangerouslySetInnerHTML={{ __html: renderRichHtml(text) }}
                />
              ) : (
                <p className="whitespace-pre-line text-sm leading-7 text-foreground dark:text-muted-foreground">{text}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview yet - write content or paste HTML first.</p>
            )}
          </div>
          <div className="border-t border-rule bg-paper-2/70 px-4 py-2 text-[11px] text-muted-foreground dark:border-ink dark:bg-ink/50">
            Live preview uses the exact public-page renderer, so what you see here is what readers see.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
