export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid caching during dev

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { loadWorkbookFromHttp } from "@/lib/loadWorkbook";
import { getPlayersForWeekFromWorkbook } from "@/lib/excel";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const week = Number(url.searchParams.get("week") || "1");
  const debug = url.searchParams.get("debug");

  try {
    // load the Excel file via HTTP so we don't depend on fs paths
    const wb = await loadWorkbookFromHttp(url.origin);

    // ── DEBUG MODE ───────────────────────────────────────────────────────────────
    if (debug === "1") {
      const names = wb.SheetNames;

      const rowsOf = (name?: string) =>
        name && wb.Sheets[name]
          ? XLSX.utils.sheet_to_json<any>(wb.Sheets[name], { header: 1, raw: true })
          : [];

      const pick = (cands: string[]) => cands.find((n) => names.includes(n)) || null;

      const passName = pick([`Passing W${week}`, `Passing Week ${week}`, `QB W${week}`, `QB Week ${week}`]);
      const rushName = pick([`Rushing W${week}`, `Rushing Week ${week}`, `RB W${week}`, `RB Week ${week}`]);
      const recvName = pick([`Receiving W${week}`, `Receiving Week ${week}`, `WR W${week}`, `WR Week ${week}`]);

      const passMat = rowsOf(passName);
      const rushMat = rowsOf(rushName);
      const recvMat = rowsOf(recvName);

      return NextResponse.json({
        sheetNames: names,
        week,
        chosen: { passing: passName, rushing: rushName, receiving: recvName },
        counts: { passing: passMat.length, rushing: rushMat.length, receiving: recvMat.length },
        headers: {
          passing: passMat[0] ?? null,
          rushing: rushMat[0] ?? null,
          receiving: recvMat[0] ?? null,
        },
        samples: {
          passing: passMat.slice(0, 3),
          rushing: rushMat.slice(0, 3),
          receiving: recvMat.slice(0, 3),
        },
      });
    }
    // ────────────────────────────────────────────────────────────────────────────

    // normal mode
    const players = getPlayersForWeekFromWorkbook(week, wb);
    return NextResponse.json({ week, players });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message || e) }, { status: 500 });
  }
}
