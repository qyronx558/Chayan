"use client";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  <div className="grid gap-4 lg:grid-cols-2">
   <Card className="border-rule dark:border-rule">
    <CardHeader className="bg-paper-2 dark:bg-ink"><CardTitle className="text-[17px] text-foreground dark:text-paper">Make photo ready</CardTitle></CardHeader>
    <CardContent className="space-y-5 p-5">
     <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => (
       <button key={p.id} onClick={() => setPreset(p)} className={`min-h-[64px] rounded-xl border p-3 text-left transition ${preset.id === p.id ? "border-rule bg-paper-2 dark:bg-ink dark:border-rule" : "border-rule dark:border-ink"}`}>
        <p className="text-[15px] font-bold">{p.label}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{p.sub}</p>
       </button>
      ))}
     </div>
     <div><Label className="text-[15px]">Need size up to (KB)</Label><Input type="number" value={customKb} onChange={(e) => setCustomKb(+e.target.value)} className="mt-1.5 h-12 text-base" /></div>
     <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
     <Button onClick={() => fileRef.current?.click()} disabled={busy} className="h-12 w-full bg-ink text-base text-paper hover:bg-ink-2">{busy ? "Making..." : "Choose photo"}</Button>
     {preview && (
      <div className="flex items-center gap-4 rounded-xl bg-paper-2 p-4 dark:bg-ink">
       {/* eslint-disable-next-line @next/next/no-img-element */}
       <img src={preview} alt="resized preview" className="h-24 w-20 rounded-lg border object-cover" />
       <div className="flex-1">
        {meta && <div className="flex flex-wrap gap-2">{meta.kb <= (customKb || preset.kb) + 1 ? <StatusPill tone="ok">✓ Ready - {meta.kb.toFixed(0)} KB</StatusPill> : <StatusPill tone="warn">A bit big - try smaller size</StatusPill>}</div>}
        <div className="mt-3 flex gap-2">
         {outUrl && <a href={outUrl} download={`${preset.id}.jpg`} className="rounded-lg bg-ink px-4 py-2.5 text-[14px] font-medium text-paper">Download</a>}
         <button onClick={printPdf} className="rounded-lg border px-4 py-2.5 text-[14px] font-bold">Save PDF</button>
        </div>
       </div>
      </div>
     )}
     <p className="text-[13px] text-muted-foreground">Private - stays on your phone.</p>
    </CardContent>
   </Card>

   <Card className="border-rule dark:border-rule">
    <CardHeader className="bg-paper-2 dark:bg-ink"><CardTitle className="text-[17px] text-foreground dark:text-paper">Compress any photo</CardTitle></CardHeader>
    <CardContent className="space-y-5 p-5">
     <div><Label className="text-[15px]">Quality: {quality}%</Label><input type="range" min={30} max={95} value={quality} onChange={(e) => setQuality(+e.target.value)} className="mt-2 w-full accent-[var(--color-brick)]" /></div>
     <input ref={compRef} type="file" accept="image/*" className="hidden" onChange={(e) => onCompress(e.target.files?.[0])} />
     <Button variant="outline" onClick={() => compRef.current?.click()} disabled={busy} className="h-12 w-full text-base">{busy ? "Making..." : "Choose image"}</Button>
     {compOut && <div className="rounded-xl bg-paper-3 p-4 text-[15px] dark:bg-ink"><StatusPill tone="ok">Ready - {compOut.kb.toFixed(0)} KB</StatusPill><a href={compOut.url} download="photo.jpg" className="ml-3 font-semibold text-foreground underline dark:text-muted-foreground">Download</a></div>}
     <p className="text-[13px] text-muted-foreground">Works for SSC, Bank, Railway, UPSC forms.</p>
    </CardContent>
   </Card>
  </div>
 );
}
