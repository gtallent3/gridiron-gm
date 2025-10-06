'use client'
import { useState } from 'react'
import Section from './ui/Section'
import Badge from './ui/Badge'
import ConfidenceBar from './ui/ConfidenceBar'
export default function TradeAnalyzer(){
  const [giveId, setGiveId] = useState('r4')
  const [getId, setGetId] = useState('o1')
  const [res, setRes] = useState<any>(null)
  const evaluate = async ()=>{
    const r = await fetch('/api/trade', { method:'POST', body: JSON.stringify({ giveId, getId }) })
    setRes(await r.json())
  }
  return (
    <Section title="Trade Analyzer" right={<Badge>Included</Badge>}>
      <div className="flex flex-wrap gap-2 items-end">
        <input className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200" value={giveId} onChange={e=>setGiveId(e.target.value)} placeholder="giveId (e.g., r4)" />
        <span className="text-zinc-500">⇄</span>
        <input className="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200" value={getId} onChange={e=>setGetId(e.target.value)} placeholder="getId (e.g., o1)" />
        <button onClick={evaluate}
          className="no-underline inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm
             bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 transition">
          Evaluate
        </button>
      </div>
      {res && (
        <div className="mt-4 p-4 bg-black/40 border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-zinc-100 font-medium">Trade Heat Score</div>
              <div className="text-xs text-zinc-400">Higher is better for you</div>
            </div>
            <div className="text-2xl font-bold">{res.score}</div>
          </div>
          <div className="mt-3"><ConfidenceBar value={res.score} /></div>
          <div className="mt-2 text-sm text-zinc-300">Verdict: {res.verdict}</div>
        </div>
      )}
    </Section>
  )
}
