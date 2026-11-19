"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { handFont, typeFont } from "@/components/home/fonts";
import { Sheet, fieldBox, fieldLabel } from "@/components/tools/tool-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/tools/ToolShell";

type Preset = { id: string; label: string; sub: string; w: number; h: number; kb: number };

const PRESETS: Preset[] = [
 { id: "ssc-photo", label: "Photo", sub: "20–50 KB", w: 600, h: 750, kb: 45 },
 { id: "ssc-sign", label: "Signature", sub: "10–20 KB", w: 600, h: 200, kb: 18 },
 { id: "upsc-photo", label: "Big photo", sub: "Up to 300 KB", w: 800, h: 1000, kb: 200 },
 { id: "thumb", label: "Thumb", sub: "Up to 30 KB", w: 400, h: 400, kb: 25 },
];

async function fileToImage(file: File): Promise<HTMLImageElement> {
 const url = URL.createObjectURL(file);
 const img = new Image();
 await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; img.src = url; });
 return img;
}

function drawCover(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
 const c = document.createElement("canvas"); c.width = w; c.height = h;
 const ctx = c.getContext("2d")!;
 ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
 const scale = Math.max(w / img.width, h / img.height);
 const dw = img.width * scale, dh = img.height * scale;
 ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
 return c;
}

async function canvasToSizedJpg(canvas: HTMLCanvasElement, targetKb: number): Promise<{ blob: Blob; kb: number }> {
 let q = 0.92;
 for (let i = 0; i < 7; i++) {
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", q));
  const kb = blob.size / 1024;
  if (kb <= targetKb || q <= 0.3) return { blob, kb };
  q -= 0.12;
 }
 const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.3));
 return { blob, kb: blob.size / 1024 };
}

export default function PhotoResizerClient() {
 const [preset, setPreset] = useState<Preset>(PRESETS[0]);
 const [customKb, setCustomKb] = useState(50);
 const [preview, setPreview] = useState<string | null>(null);
 const [outUrl, setOutUrl] = useState<string | null>(null);
 const [meta, setMeta] = useState<{ kb: number } | null>(null);
 const [busy, setBusy] = useState(false);
 const [quality, setQuality] = useState(80);
 const [compOut, setCompOut] = useState<{ url: string; kb: number } | null>(null);
 const fileRef = useRef<HTMLInputElement>(null);
 const compRef = useRef<HTMLInputElement>(null);

 const onPick = async (f: File | undefined) => {
  if (!f) return;
  setBusy(true);
  try {
   const img = await fileToImage(f);
   const c = drawCover(img, preset.w, preset.h);
   setPreview(c.toDataURL("image/jpeg", 0.85));
   const { blob, kb } = await canvasToSizedJpg(c, customKb || preset.kb);
   setOutUrl(URL.createObjectURL(blob));
   setMeta({ kb });
  } finally { setBusy(false); }
 };

 const onCompress = async (f: File | undefined) => {
  if (!f) return;
  setBusy(true);
  try {
   const img = await fileToImage(f);
   const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
   const c = document.createElement("canvas");
   c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
   c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
   const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), f.type.includes("png") ? "image/png" : "image/jpeg", quality / 100));
   setCompOut({ url: URL.createObjectURL(blob), kb: blob.size / 1024 });
  } finally { setBusy(false); }
 };

 const printPdf = () => {
  if (!preview) return;
  const w = window.open("", "_blank");
  w?.document.write(`<html><head><title>Photo - print to PDF</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${preview}" style="width:3.5cm;height:4.5cm;object-fit:cover"/></body></html>`);
  w?.document.close(); w?.focus(); setTimeout(() => w?.print(), 400);
 };

 return (
  <div className="grid items-start gap-6 lg:grid-cols-2">
   <Sheet label="COUNTER 1 · MAKE PHOTO READY" aside="pick a size from the board">
    <div className="space-y-5 p-5">
     {/* the studio's price board */}
     <div className="rounded-[6px] p-2" style={{ background: "oklch(30% 0.03 60)" }}>
      <div className="grid grid-cols-2 gap-2">
       {PRESETS.map((p) => {
        const on = preset.id === p.id
        return (
         <button
          key={p.id}
          onClick={() => setPreset(p)}
          aria-pressed={on}
          className={cn("relative flex min-h-[72px] items-center gap-3 rounded-[4px] border-2 p-3 text-left transition-all", on ? "border-[oklch(82%_0.13_85)] bg-[oklch(30%_0.04_70)] shadow-[0_0_0_3px_oklch(82%_0.13_85/0.18)]" : "border-transparent bg-[oklch(20%_0.015_60)] hover:border-[oklch(60%_0.02_70)]")}
         >
          {on ? <span className={cn(handFont.className, "absolute -top-2.5 right-2 rotate-[4deg] rounded-[3px] bg-[oklch(82%_0.13_85)] px-1.5 text-[0.9rem] leading-tight text-[oklch(25%_0.04_60)]")} aria-hidden>chosen</span> : null}
          {/* the shape of the photo, drawn to its proportions */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
           <span className="block rounded-[2px] border-[1.5px] border-[oklch(85%_0.02_80)]" style={{ width: `${(p.w / Math.max(p.w, p.h)) * 36}px`, height: `${(p.h / Math.max(p.w, p.h)) * 36}px` }} />
          </span>
          <span className="min-w-0">
           <span className="block text-[15px] font-bold text-[oklch(95%_0.01_90)]">{p.label}</span>
           <span className={cn(typeFont.className, "block text-[11.5px] text-[oklch(80%_0.12_85)]")}>{p.sub}</span>
          </span>
         </button>
        )
       })}
      </div>
     </div>
     <div><Label className={fieldLabel}>Need size up to (KB)</Label><Input type="number" value={customKb} onChange={(e) => setCustomKb(+e.target.value)} className={fieldBox} /></div>
     <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
     <Button onClick={() => fileRef.current?.click()} disabled={busy} className="h-12 w-full rounded-full text-base font-semibold">{busy ? "Making..." : "Choose photo"}</Button>
     {preview && (
      <div className="flex items-center gap-5 rounded-[6px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] p-4">
       {/* the print, taped down, with a ruler */}
       <div className="relative shrink-0 rotate-[-3deg]">
        <span className="absolute -top-2 left-1/2 z-10 h-4 w-10 -translate-x-1/2 rotate-[4deg] bg-[oklch(92%_0.03_90/0.85)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
        <div className="bg-white p-1.5 shadow-[0_6px_12px_-6px_rgb(0_0_0/.5)]">
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img src={preview} alt="resized preview" className="h-24 w-20 object-cover" />
        </div>
       </div>
       <div className="min-w-0 flex-1">
        {meta && <div className="flex flex-wrap gap-2">{meta.kb <= (customKb || preset.kb) + 1 ? <StatusPill tone="ok">✓ Ready - {meta.kb.toFixed(0)} KB</StatusPill> : <StatusPill tone="warn">A bit big - try smaller size</StatusPill>}</div>}
        <div className="mt-4 flex flex-wrap gap-2">
         {outUrl && <a href={outUrl} download={`${preset.id}.jpg`} className="rounded-full bg-foreground px-5 py-2.5 text-[14px] font-semibold text-background transition-transform hover:-translate-y-px">Download</a>}
         <button onClick={printPdf} className="rounded-full border-[1.5px] border-[var(--hs-border-strong)] px-5 py-2.5 text-[14px] font-semibold text-foreground transition-transform hover:-translate-y-px">Save PDF</button>
        </div>
       </div>
      </div>
     )}
     <p className={cn(handFont.className, "text-[1.05rem] text-[oklch(45%_0.11_155)]")}>Private - stays on your phone.</p>
    </div>
   </Sheet>

   <Sheet label="COUNTER 2 · COMPRESS ANY PHOTO" aside="the darkroom">
    <div className="space-y-5 p-5">
     <div>
      <Label className={fieldLabel}>Quality: {quality}%</Label>
      <input type="range" min={30} max={95} value={quality} onChange={(e) => setQuality(+e.target.value)} className="mt-3 w-full accent-[var(--color-brick)]" />
      <div className={cn(typeFont.className, "mt-1 flex justify-between text-[10.5px] text-muted-foreground")} aria-hidden><span>SMALLER FILE</span><span>SHARPER PHOTO</span></div>
     </div>
     <input ref={compRef} type="file" accept="image/*" className="hidden" onChange={(e) => onCompress(e.target.files?.[0])} />
     <Button variant="outline" onClick={() => compRef.current?.click()} disabled={busy} className="h-12 w-full rounded-full text-base font-semibold">{busy ? "Making..." : "Choose image"}</Button>
     {compOut && <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-surface)] p-4 text-[15px]"><StatusPill tone="ok">Ready - {compOut.kb.toFixed(0)} KB</StatusPill><a href={compOut.url} download="photo.jpg" className={cn(handFont.className, "text-[1.15rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>Download</a></div>}
     <p className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>Works for SSC, Bank, Railway, UPSC forms.</p>
    </div>
   </Sheet>
  </div>
 );
}
