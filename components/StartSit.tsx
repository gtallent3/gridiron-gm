'use client'
import { useEffect, useMemo, useState } from 'react'
import Section from './Section'
import Badge from './Badge'
import ConfidenceBar from './ConfidenceBar'

const TinyBtn = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props}
    className={"px-2.5 py-1 rounded-lg text-[11px] border border-zinc-700/60 bg-zinc-900/80 hover:bg-zinc-800 transition " + (props.className||'')} />
)

export default function StartSit(){
  const [list, setList] = useState<any[]>([])
  const [q, setQ] = useState('')
  useEffect(()=>{ fetch('/api/players').then(r=>r.json()).then(d=>setList(d.players)) },[])
  const filtered = useMemo(()=> list.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())), [list,q])

  return (
    <Section title="Start / Sit Assistant" right={<Badge tone="emerald">Alpha</Badge>}>
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-3 py-2">
          <input
            className="w-full bg-transparent placeholder:text-zinc-500 text-sm text-zinc-200 outline-none"
            placeholder="Search player (e.g., Nico Collins)"
            value={q} onChange={e=>setQ(e.target.value)}
          />
        </div>
        <button className="rounded-xl border border-emerald-600/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          Must-Starts 🔥
        </button>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3 list-none m-0 p-0">
        {filtered.map((p:any)=> (
          <li key={p.id}
              className="p-4 rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/70 via-black/60 to-zinc-900/60 shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-zinc-100 font-semibold leading-tight">{p.name} <span className="text-zinc-400 font-normal">({p.team} · {p.pos})</span></div>
                <div className="text-[11px] text-zinc-400">vs {p.opp} secondary</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-300 font-semibold">{p.conf}%</div>
                <div className="text-[11px] text-zinc-400">Confidence</div>
              </div>
            </div>

            <div className="mt-2"><ConfidenceBar value={p.conf||50} /></div>

            <div className="mt-3 text-[13px] text-zinc-200">
              {(p.conf ?? 0) >= 70
                ? "Start: favorable CB matchup vs zone-heavy CIN"
                : (p.conf ?? 0) >= 60
                ? "Start: high red-zone share & pass-game usage"
                : "Bench: likely shadow coverage lowers ceiling"}
            </div>

            <div className="mt-3 flex gap-2">
              <TinyBtn>Share</TinyBtn>
              <TinyBtn className="bg-zinc-900/60">Clip</TinyBtn>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
