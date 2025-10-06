'use client'
import { useEffect, useState } from 'react'
import Section from './ui/Section'
import Badge from './ui/Badge'
import ConfidenceBar from './ui/ConfidenceBar'
export default function StartSit(){
  const [list, setList] = useState<any[]>([])
  const [q, setQ] = useState('')
  useEffect(()=>{ fetch('/api/players').then(r=>r.json()).then(d=>setList(d.players)) },[])
  const filtered = list.filter((p)=>p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Section title="Start / Sit Assistant" right={<Badge>Included</Badge>}>
      <div className="mb-4 flex gap-2">
        <input className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200" placeholder="Search player" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>
      <ul className="grid md:grid-cols-2 gap-3 list-none m-0 p-0">
        {filtered.map((p:any)=> (
          <li key={p.id} className="p-4 bg-gradient-to-br from-zinc-900/70 via-black/60 to-zinc-900/50 rounded-xl border border-zinc-800 hover:border-emerald-500/20 transition hover:border-emerald-500/20 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-100 font-medium">{p.name} <span className="text-zinc-500">({p.team} · {p.pos})</span></div>
                <div className="text-xs text-zinc-400 mb-2">vs {p.opp} secondary</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-300 font-semibold">{p.conf}%</div>
                <div className="text-xs text-zinc-400">Confidence</div>
              </div>
            </div>
            <div className="my-2"><ConfidenceBar value={p.conf||50} /></div>
            <div className="text-sm text-zinc-300">Mock reasoning. Wire to model.</div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
