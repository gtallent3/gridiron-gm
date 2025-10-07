// app/api/players/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { loadWorkbookFromHttp } from "@/lib/loadWorkbook";
import { getPlayersForWeekFromWorkbook } from "@/lib/excel";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const week = Number(url.searchParams.get("week") || "1");

  try {
    const wb = await loadWorkbookFromHttp(url.origin);
    const players = getPlayersForWeekFromWorkbook(week, wb);
    return NextResponse.json({ week, players });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: String(e?.message || e) },
      { status: 500 }
    );
  }
}
