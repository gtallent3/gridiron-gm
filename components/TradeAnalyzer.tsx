'use client'
import { useEffect, useState } from 'react'
import Section from './Section'
import Badge from './Badge'
import ConfidenceBar from './ConfidenceBar'

type Opt = { id:string; label:string }
const SelectPill = ({ value, onChange, options, label }:{
  value:string; onChange:(v:string)=>void; options:Opt[]; label:string
}) => (
  <label className="w-full">
    <div className="text-[11px] text-zinc-400 mb-1">{label}</div>
    <div className="relative rounded-xl border border-zinc-700/60 bg-zinc-950/70">
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        className="w-full appearance-none bg-transparent text-zinc-200 text-sm px-3 py-2.5 outline-none"
      >
        {options.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">▾</div>
    </div>
  </label>
)

export default function TradeAnalyzer(){
  const [giveId, setGiveId] = useState('r4')
  const [getId, setGetId]   = useState('o1')
  const [res, setRes] = useState<any>(null)
  const [myOpts, setMyOpts] = useState<Opt[]>([])
  const [thOpts, setThOpts] = useState<Opt[]>([])

  useEffect(()=>{
    fetch('/api/league/me').then(r=>r.json()).then(d=>{
      setMyOpts(d.roster.map((p:any)=>({ id:p.id, label:`${p.name} (${p.pos}) · ${p.team}` })))
    })
    // quick mirror of mock league options
    setThOpts([
      { id:'o1', label:'Saquon Barkley (RB) · PHI' },
      { id:'o2', label:'A.J. Brown (WR) · PHI' },
      { id:'o3', label:'Deebo Samuel (WR) · SF'  },
      { id:'o4', label:'James Cook (RB) · BUF'  },
    ])
  },[])

  const evaluate = async ()=>{
    const r = await fetch('/api/trade', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ giveId, getId }) })
    setRes(await r.json())
  }

  return (
    <Section title="Trade Analyzer" right={<Badge tone="blue">Beta</Badge>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <SelectPill value={giveId} onChange={setGiveId} options={myOpts} label="You Give" />
        <SelectPill value={getId}  onChange={setGetId}  options={thOpts} label="You Get" />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800/80 bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-100 font-semibold">Trade Heat Score</div>
            <div className="text-[11px] text-zinc-400">Higher is better for you</div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 tabular-nums">{res?.score ?? '–'}</div>
        </div>

        <div className="mt-3"><ConfidenceBar value={Number(res?.score ?? 0)} /></div>

        <div className="mt-2 text-[13px] text-zinc-200">
          {res
            ? (res.score>=65 ? "🔥 You're fleecing them." : res.score>=45 ? "🤝 Fair-ish—depends on team needs." : "⚠️ You're losing this trade.")
            : "Pick players and evaluate."}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={evaluate} className="px-3 py-1.5 rounded-lg text-xs border border-emerald-600/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">Post Fleece or Fair?</button>
          <button className="px-3 py-1.5 rounded-lg text-xs border border-zinc-700/60 bg-zinc-900/80 hover:bg-zinc-800">Share</button>
        </div>
      </div>
    </Section>
  )
}
