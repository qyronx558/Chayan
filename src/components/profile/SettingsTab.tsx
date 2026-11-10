"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import {
  Accessibility,
  Bell,
  BellOff,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const STORAGE_PREFIX = "settings:"

function getStored(key: string, fallback: string): string {
  try { return localStorage.getItem(STORAGE_PREFIX + key) ?? fallback } catch { return fallback }
}
function setStored(key: string, value: string) {
  try { localStorage.setItem(STORAGE_PREFIX + key, value) } catch { /* silent */ }
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const

const FONT_SIZES = [
  { value: "sm", label: "Small", px: "14px" },
  { value: "base", label: "Default", px: "16px" },
  { value: "lg", label: "Large", px: "18px" },
  { value: "xl", label: "Extra large", px: "20px" },
]

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST, UTC+6)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
]

const START_PAGES = [
  { value: "/", label: "Home" },
  { value: "/jobs", label: "Jobs" },
  { value: "/results", label: "Results" },
  { value: "/admit-cards", label: "Admit Cards" },
  { value: "/notifications", label: "Notifications" },
  { value: "/applications", label: "My Applications" },
  { value: "/bookmarks", label: "My Bookmarks" },
]

const KEYBOARD_SHORTCUTS = [
  { keys: ["?"], action: "Show keyboard shortcuts" },
  { keys: ["/"], action: "Focus search" },
  { keys: ["g", "h"], action: "Go to Home" },
  { keys: ["g", "j"], action: "Go to Jobs" },
  { keys: ["g", "p"], action: "Go to Profile" },
  { keys: ["g", "b"], action: "Go to Bookmarks" },
  { keys: ["g", "n"], action: "Go to Notifications" },
  { keys: ["Esc"], action: "Close dialog / cancel" },
]

interface SettingsTabProps {
  prefs: Record<string, boolean | string> | null
  onPrefsChange: (key: string, value: boolean | string) => void
}

export function SettingsTab({ prefs, onPrefsChange }: SettingsTabProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [compact, setCompact] = useState(false)
  const [fontSize, setFontSize] = useState("base")
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [startPage, setStartPage] = useState("/")
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoplayPreviews, setAutoplayPreviews] = useState(true)
  const [openLinksNewTab, setOpenLinksNewTab] = useState(true)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCompact(getStored("compactMode", "false") === "true")
    setFontSize(getStored("fontSize", "base"))
    setReducedMotion(getStored("reducedMotion", "false") === "true")
    setHighContrast(getStored("highContrast", "false") === "true")
    setStartPage(getStored("startPage", "/"))
    setSoundEnabled(getStored("soundEnabled", "true") === "true")
    setAutoplayPreviews(getStored("autoplayPreviews", "true") === "true")
    setOpenLinksNewTab(getStored("openLinksNewTab", "true") === "true")
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setTimezone(getStored("timezone", tz || "Asia/Kolkata"))
    } catch {
      setTimezone(getStored("timezone", "Asia/Kolkata"))
    }
  }, [])

  function updateSetting(key: string, value: string, setter: (v: boolean) => void, boolVal: boolean) {
    setter(boolVal)
    setStored(key, value)
    applyDomSetting(key, value)
  }

  function applyDomSetting(key: string, value: string) {
    const html = document.documentElement
    switch (key) {
      case "compactMode":
        html.classList.toggle("compact", value === "true")
        break
      case "fontSize": {
        const px = FONT_SIZES.find(f => f.value === value)?.px ?? "16px"
        html.style.fontSize = px
        break
      }
      case "reducedMotion":
        html.classList.toggle("reduce-motion", value === "true")
        break
      case "highContrast":
        html.classList.toggle("high-contrast", value === "true")
        break
    }
  }

  function resetAllSettings() {
    const keys = ["compactMode", "fontSize", "reducedMotion", "highContrast", "startPage", "timezone", "soundEnabled", "autoplayPreviews", "openLinksNewTab"]
    keys.forEach(k => { try { localStorage.removeItem(STORAGE_PREFIX + k) } catch { /* silent */ } })
    setCompact(false)
    setFontSize("base")
    setReducedMotion(false)
    setHighContrast(false)
    setStartPage("/")
    setSoundEnabled(true)
    setAutoplayPreviews(true)
    setOpenLinksNewTab(true)
    setTheme("system")
    document.documentElement.classList.remove("compact", "reduce-motion", "high-contrast")
    document.documentElement.style.fontSize = ""
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setTimezone(tz || "Asia/Kolkata")
      setStored("timezone", tz || "Asia/Kolkata")
    } catch { /* silent */ }
    toast("All settings reset to defaults", "success")
  }

  if (!mounted) return null

  return (
    <div className="space-y-4">
      {/* Appearance */}
      <DataCard title="Appearance" subtitle="Theme, font size, and display density">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => {
                const active = theme === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "group flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule focus-visible:ring-offset-2",
                      active
                        ? "border-brick bg-paper-2 text-brick dark:border-brick dark:bg-background/10"
                        : "border-rule bg-background text-muted-foreground hover:border-brick/40 dark:border-rule dark:hover:border-brick/40"
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Font size</Label>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZES.map((f) => {
                const active = fontSize === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setFontSize(f.value)
                      setStored("fontSize", f.value)
                      applyDomSetting("fontSize", f.value)
                    }}
                    className={cn(
                      "rounded-lg border-2 px-2 py-2 text-center text-xs font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                      active
                        ? "border-brick bg-paper-2 text-brick dark:border-brick dark:bg-background/10"
                        : "border-rule text-muted-foreground hover:border-brick/40"
                    )}
                  >
                    <span className="block" style={{ fontSize: f.px }}>Aa</span>
                    <span className="mt-1 block">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {compact ? <Minimize2 className="h-4 w-4 text-brick" /> : <Maximize2 className="h-4 w-4 text-muted-foreground" />}
              <div>
                <Label htmlFor="s-compact" className="cursor-pointer">Compact mode</Label>
                <p className="text-xs text-muted-foreground">Tighter spacing for a denser layout</p>
              </div>
            </div>
            <Switch id="s-compact" checked={compact} onCheckedChange={(v) => updateSetting("compactMode", String(v), setCompact, v)} />
          </div>
        </div>
      </DataCard>

      {/* Accessibility */}
      <DataCard title="Accessibility" subtitle="Motion, contrast, and assistive features">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Accessibility className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-motion" className="cursor-pointer">Reduce motion</Label>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
              </div>
            </div>
            <Switch id="s-motion" checked={reducedMotion} onCheckedChange={(v) => updateSetting("reducedMotion", String(v), setReducedMotion, v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-contrast" className="cursor-pointer">High contrast</Label>
                <p className="text-xs text-muted-foreground">Stronger borders and text contrast</p>
              </div>
            </div>
            <Switch id="s-contrast" checked={highContrast} onCheckedChange={(v) => updateSetting("highContrast", String(v), setHighContrast, v)} />
          </div>
        </div>
      </DataCard>

      {/* Region & Time */}
      <DataCard title="Region & time" subtitle="Timezone for deadlines and reminders">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-timezone">Timezone</Label>
            <Select value={timezone} onValueChange={(v) => { setTimezone(v); setStored("timezone", v) }}>
              <SelectTrigger id="s-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used for deadline reminders and notification timing.</p>
          </div>
        </div>
      </DataCard>

      {/* Navigation & Behavior */}
      <DataCard title="Navigation & behavior" subtitle="How the site behaves for you">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-start-page">Default start page</Label>
            <Select value={startPage} onValueChange={(v) => { setStartPage(v); setStored("startPage", v) }}>
              <SelectTrigger id="s-start-page">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {START_PAGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Page shown when you open the site.</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-newtab" className="cursor-pointer">Open external links in new tab</Label>
                <p className="text-xs text-muted-foreground">Job application links, official websites, etc.</p>
              </div>
            </div>
            <Switch id="s-newtab" checked={openLinksNewTab} onCheckedChange={(v) => { setOpenLinksNewTab(v); setStored("openLinksNewTab", String(v)) }} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <div>
                <Label htmlFor="s-sound" className="cursor-pointer">Notification sounds</Label>
                <p className="text-xs text-muted-foreground">Play a sound for in-app notifications</p>
              </div>
            </div>
            <Switch id="s-sound" checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); setStored("soundEnabled", String(v)) }} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-autoplay" className="cursor-pointer">Autoplay previews</Label>
                <p className="text-xs text-muted-foreground">Auto-expand job details when hovering in search</p>
              </div>
            </div>
            <Switch id="s-autoplay" checked={autoplayPreviews} onCheckedChange={(v) => { setAutoplayPreviews(v); setStored("autoplayPreviews", String(v)) }} />
          </div>
        </div>
      </DataCard>

      {/* Communication Preferences */}
      <DataCard title="Communication" subtitle="Control marketing and digest emails">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-marketing" className="cursor-pointer">Promotional emails</Label>
                <p className="text-xs text-muted-foreground">Tips, job market updates, and feature announcements</p>
              </div>
            </div>
            <Switch
              id="s-marketing"
              checked={prefs?.["marketingEmails"] === true}
              onCheckedChange={(v) => onPrefsChange("marketingEmails", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="s-digest" className="cursor-pointer">Weekly digest</Label>
                <p className="text-xs text-muted-foreground">Summary of new jobs and deadlines every Monday</p>
              </div>
            </div>
            <Switch
              id="s-digest"
              checked={prefs?.["weeklyDigest"] === true}
              onCheckedChange={(v) => onPrefsChange("weeklyDigest", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {prefs?.["muteAllNotifications"] === true ? <BellOff className="h-4 w-4 text-brick" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
              <div>
                <Label htmlFor="s-mute-all" className="cursor-pointer">Mute all notifications</Label>
                <p className="text-xs text-muted-foreground">Temporarily pause all email, SMS, and push notifications</p>
              </div>
            </div>
            <Switch
              id="s-mute-all"
              checked={prefs?.["muteAllNotifications"] === true}
              onCheckedChange={(v) => onPrefsChange("muteAllNotifications", v)}
            />
          </div>
        </div>
      </DataCard>

      {/* Keyboard Shortcuts */}
      <DataCard
        title="Keyboard shortcuts"
        subtitle="Quick navigation with your keyboard"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardShortcuts((v) => !v)}
            className="text-xs"
          >
            {showKeyboardShortcuts ? "Hide" : "Show"}
          </Button>
        }
      >
        {showKeyboardShortcuts ? (
          <div className="space-y-1">
            {KEYBOARD_SHORTCUTS.map((s) => (
              <div key={s.action} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-sm text-muted-foreground">{s.action}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <span key={k}>
                      {i > 0 ? <span className="mx-0.5 text-xs text-muted-foreground">then</span> : null}
                      <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-rule bg-paper-2 px-1.5 py-0.5 font-mono text-xs font-medium text-foreground dark:bg-background/10 dark:text-paper">
                        {k}
                      </kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Press <kbd className="mx-0.5 rounded border border-rule bg-paper-2 px-1.5 py-0.5 font-mono text-xs dark:bg-background/10">?</kbd> anywhere to see all keyboard shortcuts.
          </p>
        )}
      </DataCard>

      {/* Legal Links */}
      <DataCard title="Legal" subtitle="Your rights and our policies">
        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Privacy policy <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/terms" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Terms of service <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/cookie-policy" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Cookie policy <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/disclaimer" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline-offset-4 hover:underline dark:text-brick">
            Disclaimer <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </DataCard>

      {/* Reset */}
      <DataCard title="Reset settings" subtitle="Restore everything to defaults">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            This resets theme, font size, compact mode, accessibility, and navigation preferences to their defaults.
          </p>
          <Button variant="outline" size="sm" className="shrink-0 text-brick hover:text-brick" onClick={resetAllSettings}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset all
          </Button>
        </div>
      </DataCard>
    </div>
  )
}
