import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import PhotoResizerClient from "@/components/tools/PhotoResizerClient";

export const metadata: Metadata = {
  title: "Photo & Signature Resizer for SSC IBPS Railway - 20KB JPG + Compressor",
  description: "Resize photo to 20-50KB SSC spec, signature to 10-20KB, compress any image, save as PDF. 100% in-browser - files never upload.",
  keywords: ["ssc photo resizer 20kb", "signature resizer 10kb", "ibps photo size", "image compressor online", "photo to pdf"],
  alternates: { canonical: "/tools/photo-resizer" },
};

export default function Page() {
  return (
    <ToolShell toolKey="photo" badge="Private • Stays on your phone" title="Photo Resizer" subtitle="Make photo and signature ready for forms in one click." faq={[
      { q: "What size does SSC need?", a: "Photo 20–50 KB JPG (approx 600×750px), signature 10–20 KB (600×200px), white background. IBPS similar; UPSC allows up to 300 KB." },
      { q: "Are my photos uploaded anywhere?", a: "No. All resizing happens in your browser via canvas. Nothing is sent to our servers." },
      { q: "How do I make a PDF?", a: "After resizing, click 'Save as PDF' - use your browser's Print → Save as PDF option." },
    ]}>
      <PhotoResizerClient />
    </ToolShell>
  );
}
