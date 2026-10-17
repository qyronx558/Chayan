/**
 * Bulletproof PDF download for the ChayanJobs in-app browser.
 *
 * Strategy: try the same-origin proxy first (clean filename, user never
 * leaves the tab). If the proxy fails for ANY reason - gov server blocks
 * datacenter IPs, timeout, non-PDF response - fall back to the official
 * URL in a new tab where Chrome's native viewer/download takes over.
 * The user gets the file in any case; never a dead "Site wasn't available".
 */

export type PdfDownloadResult = "proxied" | "direct" | "failed";

interface DownloadPdfArgs {
  /** Same-origin /api/doc?download=1 URL (clean filename). */
  proxyUrl: string;
  /** Official file URL - guaranteed fallback. */
  directUrl: string;
  filename: string;
  /** Bound the proxy attempt so the fallback kicks in promptly. */
  timeoutMs?: number;
}

export async function downloadPdfFile({
  proxyUrl,
  directUrl,
  filename,
  timeoutMs = 12000,
}: DownloadPdfArgs): Promise<PdfDownloadResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(proxyUrl, { signal: controller.signal, credentials: "same-origin" });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`proxy responded ${res.status}`);
    const blob = await res.blob();
    const type = (blob.type || "").toLowerCase();
    // Guard: proxy error pages come back as small JSON, not PDFs.
    if (blob.size === 0 || (!type.includes("pdf") && blob.size < 65536)) {
      throw new Error("proxy did not return a PDF");
    }
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
    return "proxied";
  } catch {
    // Fallback: official file in a new tab - Chrome handles it natively.
    try {
      const win = window.open(directUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        // Popup blocked: same-tab navigation still delivers the file
        // (tabs restore from sessionStorage on Back).
        window.location.assign(directUrl);
      }
      return "direct";
    } catch {
      return "failed";
    }
  }
}
