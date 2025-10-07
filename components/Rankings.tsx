'use client'
import { useEffect, useState } from 'react'
import Section from './ui/section'
import Badge from './ui/badge'
export default function Rankings(){
  const [pos, setPos] = useState('WR')
  const [week, setWeek] = useState(6)
  const [rows, setRows] = useState<any[]>([])
  useEffect(()=>{ fetch(`/api/rankings?pos=${pos}&week=${week}`).then(r=>r.json()).then(d=>setRows(d.rankings)) },[pos, week])
  return (
    <Section title="Weekly Rankings" right={<Badge>New</Badge>}>
      <div className="flex gap-3 flex-wrap items-center mb-3">
        {['QB','RB','WR','TE'].map(k=> (
          <button key={k} onClick={()=>setPos(k)} className={`px-3 py-1.5 rounded-lg border text-sm ${pos===k?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-zinc-900 text-zinc-300 border-zinc-800"}`}>{k}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-400">Week</span>
          <select value={week} onChange={e=>setWeek(parseInt(e.target.value))} className="bg-black/40 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200">
            {Array.from({length:18},(_,i)=>i+1).map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-black/40 text-zinc-400 sticky top-0">
            <tr>
              <th className="text-left p-3 w-16">#</th>
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">Opp</th>
              <th className="text-left p-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any, i:number)=> (
              <tr key={`${pos}-${r.rank}`} className={`border-t border-zinc-800 ${i%2 ? 'bg-zinc-900/30' : ''}`}>
                ...
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-zinc-500">Mock data—wire to projections provider for prod.</div>
    </Section>
  )
}
