// lib/loadWorkbook.ts
import * as XLSX from "xlsx";

/**
 * Fetch /data/2025-weekly-stats.xlsx over HTTP and return an XLSX workbook.
 * Avoids any filesystem/cwd issues.
 */
export async function loadWorkbookFromHttp(baseUrl: string) {
  const url = new URL("/data/2025-weekly-stats.xlsx", baseUrl).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return XLSX.read(buf, { type: "array" });
}
