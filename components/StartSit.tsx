"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, ShieldAlert, LineChart, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

/* ---------------- Types ---------------- */

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
};

/* -------- Small UI helpers -------- */

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

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">{label}</div>
      <div className={cn("text-lg font-semibold", positive ? "text-emerald-400" : "text-zinc-100")}>{value}</div>
    </div>
  );
}

function volatility(arr: number[]) {
  if (arr.length < 2) return "0.0";
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = Math.sqrt(arr.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (arr.length - 1));
  return v.toFixed(1);
}
function trend(arr: number[]) {
  if (arr.length < 2) return 0;
  return arr[arr.length - 1] - arr[0];
}

/* ---------------- Main ---------------- */

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);
const POSITIONS: Array<Player["pos"] | "ALL"> = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

export default function StartSit() {
  const [week, setWeek] = useState(1); // single week only
  const [players, setPlayers] = useState<Player[]>([]);
  const [query, setQuery] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [posFilter, setPosFilter] = useState<Player["pos"] | "ALL">("ALL");
  const [selected, setSelected] = useState<Player | null>(null);

  // Fetch for the selected week
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/players?week=${week}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => !cancelled && setPlayers((data.players ?? []) as Player[]))
      .catch(() => !cancelled && setPlayers([]));
    return () => {
      cancelled = true;
    };
  }, [week]);

  // Filters
  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matches = p.name.toLowerCase().includes(query.toLowerCase());
      const riskOk = riskOnly ? p.risk !== "low" : true;
      const posOk = posFilter === "ALL" ? true : p.pos === posFilter;
      return matches && riskOk && posOk;
    });
  }, [players, query, riskOnly, posFilter]);

  return (
    <section>
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Week selector */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 border border-white/10 px-3 py-2">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-300 mr-1">Week</span>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="bg-transparent text-sm text-zinc-200 outline-none"
          >
            {WEEKS.map((w) => (
              <option key={w} value={w} className="bg-zinc-900">
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 bg-zinc-900/50 border-white/10 w-64"
          />
        </div>

        {/* Position selector (dropdown like Week) */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/50 border border-white/10 px-3 py-2">
          <span className="text-sm text-zinc-300 mr-1">Position</span>
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value as any)}
            className="bg-transparent text-sm text-zinc-200 outline-none"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p} className="bg-zinc-900">
                {p === "ALL" ? "All" : p}
              </option>
            ))}
          </select>
        </div>

        {/* Risk only toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-zinc-400">Risk only</span>
          <Switch checked={riskOnly} onCheckedChange={setRiskOnly} />
        </div>
      </div>

      {/* Player grid */}
      <div className="grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
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
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
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
              <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-3">
                  <Metric label="ProjPT" value={selected.projected.toFixed(1)} />
                  <Metric label="Volatility" value={volatility(selected.spark)} />
                  <Metric
                    label="Form"
                    value={`${trend(selected.spark) > 0 ? "+" : ""}${trend(selected.spark).toFixed(1)}`}
                  />
                  <Metric
                    label="Decision"
                    value={selected.startable ? "START" : "SIT"}
                    positive={selected.startable}
                  />
                </div>

                <div className="text-xs text-zinc-400 leading-relaxed">
                  Rationale (demo): matchup adjustment +7%, targets ↑ last 3 weeks, injury tag clear.
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
              <div className="text-sm text-zinc-400">Pick a player to see detailed metrics and reasoning.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
