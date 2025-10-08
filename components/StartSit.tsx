"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, ShieldAlert, LineChart, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/* ---------- Types must match your API ---------- */
type StatBreakdown = {
  passYds: number; passTD: number; ints: number;
  rushYds: number; rushTD: number; fumbles: number;
  rec: number; recYds: number; recTD: number;
};

type Player = {
  id: string;
  name: string;
  initials: string;
  team: string;
  pos: "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
  opp: string;
  risk: "low" | "med" | "high";
  projected: number;
  startable: boolean;
  spark: number[];
  stats: StatBreakdown;
};

/* ---------- UI helpers ---------- */

function MiniSpark({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 30 - ((v - min) / (max - min || 1)) * 30;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-6">
      <polyline fill="none" stroke="currentColor" strokeOpacity="0.8" strokeWidth="2" points={pts} />
    </svg>
  );
}

function RiskPill({ level }: { level: Player["risk"] }) {
  const cls =
    level === "low"
      ? "border-emerald-700/50 text-emerald-300/90 bg-emerald-900/20"
      : level === "med"
      ? "border-amber-700/50 text-amber-300/90 bg-amber-900/20"
      : "border-rose-700/50 text-rose-300/90 bg-rose-900/20";
  return <div className={cn("text-xs px-2 py-0.5 rounded-full border", cls)}>{level}</div>;
}

function StartSitChip({ startable }: { startable: boolean }) {
  return (
    <Badge
      variant={startable ? "default" : "destructive"}
      className={cn(
        "rounded-full text-xs tracking-wide px-2.5 py-0.5",
        startable ? "bg-emerald-600 hover:bg-emerald-600" : "bg-rose-600 hover:bg-rose-600"
      )}
    >
      {startable ? "START" : "SIT"}
    </Badge>
  );
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

const fmt0 = (n: number) => (Math.round((n + Number.EPSILON) * 10) / 10).toString().replace(/\.0$/, "");

/** Return the small set of stat boxes we want to show per position (on the card) */
function cardStatBoxes(p: Player) {
  const s = p.stats;
  if (p.pos === "QB") {
    return [
      { k: "Pass Yds", v: fmt0(s.passYds) },
      { k: "Pass TD", v: s.passTD },
      { k: "INT", v: s.ints },
      { k: "Rush Yds", v: fmt0(s.rushYds) },
      { k: "Rush TD", v: s.rushTD },
    ];
  }
  if (p.pos === "RB") {
    return [
      { k: "Rush Yds", v: fmt0(s.rushYds) },
      { k: "Rush TD", v: s.rushTD },
      { k: "Rec", v: s.rec },
      { k: "Rec Yds", v: fmt0(s.recYds) },
      { k: "Rec TD", v: s.recTD },
      { k: "Fum", v: s.fumbles },
    ];
  }
  // WR / TE default
  return [
    { k: "Rec", v: s.rec },
    { k: "Rec Yds", v: fmt0(s.recYds) },
    { k: "Rec TD", v: s.recTD },
    { k: "Rush Yds", v: fmt0(s.rushYds) },
    { k: "Rush TD", v: s.rushTD },
  ];
}

/* ---------- MAIN ---------- */

export default function StartSit() {
  const [week, setWeek] = useState(1);
  const [pos, setPos] = useState<"ALL" | Player["pos"]>("ALL");
  const [players, setPlayers] = useState<Player[]>([]);
  const [query, setQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/players?week=${week}`)
      .then((r) => r.json())
      .then((data) => !cancelled && setPlayers(data.players ?? []))
      .catch(() => !cancelled && setPlayers([]));
    return () => {
      cancelled = true;
    };
  }, [week]);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matches = p.name.toLowerCase().includes(query.toLowerCase());
      const riskOk = riskOnly ? p.risk !== "low" : true;
      const posOk = pos === "ALL" ? true : p.pos === pos;
      return matches && riskOk && posOk;
    });
  }, [players, query, riskOnly, pos]);

  return (
    <section>
      {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-zinc-300" />
          <label className="text-zinc-300 text-sm">Week</label>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="h-8 rounded-md bg-zinc-900/60 border border-white/10 px-2 text-sm"
          >
            {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* Position Selector */}
        <div className="flex items-center gap-2">
          <label className="text-zinc-300 text-sm">Pos</label>
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value as any)}
            className="h-8 rounded-md bg-zinc-900/60 border border-white/10 px-2 text-sm"
          >
            <option value="ALL">All</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
            <option value="DEF">DEF</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 bg-zinc-900/50 border-white/10 w-full"
          />
        </div>

        {/* Risk Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-zinc-400">Risk only</span>
          <Switch checked={riskOnly} onCheckedChange={setRiskOnly} />
        </div>
      </div>

      {/* Player grid: 3 columns */}
      <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const boxes = cardStatBoxes(p).slice(0, 6); // keep it compact on card
          return (
            <Card
              key={p.id}
              onClick={() => setSelected(p)}
              className={cn(
                "bg-zinc-900/60 border-white/10 hover:border-emerald-700/40 transition cursor-pointer",
                selected?.id === p.id && "ring-1 ring-emerald-600/60"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-800 grid place-content-center text-sm font-semibold">
                      {p.initials}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold leading-tight">{p.name}</CardTitle>
                      <div className="text-xs text-zinc-400">
                        {p.team} · {p.pos} · {p.opp} ·{" "}
                        <span className="inline-flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> <span>{p.risk}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <StartSitChip startable={p.startable} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                  <LineChart className="h-3 w-3" />
                  Projected PPR
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-semibold">{p.projected.toFixed(1)}</div>
                  <div className="w-28 text-emerald-400/80">
                    <MiniSpark values={p.spark} />
                  </div>
                </div>

                {/* NEW: compact stat boxes on the card */}
                <div className="grid grid-cols-3 gap-2">
                  {boxes.map((b) => (
                    <MetricBox key={b.k} label={b.k} value={b.v} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details panel */}
      <div className="mt-6">
        <Card className="bg-zinc-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">
              {selected ? selected.name : "Select a player"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 grid place-content-center text-sm font-semibold">
                    {selected.initials}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {selected.team} · {selected.pos} · {selected.opp}
                    <div className="mt-1">
                      <RiskPill level={selected.risk} />
                    </div>
                  </div>
                </div>

                {/* Big stat grid in the drawer */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {/* Passing */}
                  <MetricBox label="Pass Yds" value={fmt0(selected.stats.passYds)} />
                  <MetricBox label="Pass TD" value={selected.stats.passTD} />
                  <MetricBox label="INT" value={selected.stats.ints} />
                  {/* Rushing */}
                  <MetricBox label="Rush Yds" value={fmt0(selected.stats.rushYds)} />
                  <MetricBox label="Rush TD" value={selected.stats.rushTD} />
                  <MetricBox label="Fumbles" value={selected.stats.fumbles} />
                  {/* Receiving */}
                  <MetricBox label="Rec" value={selected.stats.rec} />
                  <MetricBox label="Rec Yds" value={fmt0(selected.stats.recYds)} />
                  <MetricBox label="Rec TD" value={selected.stats.recTD} />
                </div>

                <div className="flex gap-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 w-full">
                    <Check className="h-4 w-4 mr-2" /> Start
                  </Button>
                  <Button variant="destructive" className="w-full">
                    <X className="h-4 w-4 mr-2" /> Sit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-400">
                Pick a player to see detailed metrics and reasoning.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}