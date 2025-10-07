'use client'
import { useState } from 'react'
import Section from './ui/section'
import Badge from './ui/badge'
export default function LeagueSync(){
  const [status, setStatus] = useState('Not Connected')
  const [platform, setPlatform] = useState('sleeper')
  const [identifier, setIdentifier] = useState('')
  const [token, setToken] = useState('')
  const connect = async ()=>{
    const r = await fetch('/api/league/connect', { method:'POST', body: JSON.stringify({ platform, identifier, token }) })
    const d = await r.json(); setStatus(d.ok?`Connected to ${d.platform} (mock)`: 'Error')
  }
  return (
    <Section title="League Sync" right={<Badge>New</Badge>}>
      <div className="grid md:grid-cols-3 gap-3">
        <select value={platform} onChange={e=>setPlatform(e.target.value)} className="bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200">
          <option value="sleeper">Sleeper</option><option value="espn">ESPN</option><option value="yahoo">Yahoo</option>
        </select>
        <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="User/League ID or cookie" className="bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200" />
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Token (optional)" className="bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Status: {status}</div>
        <button onClick={connect} className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Connect</button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Replace with provider OAuth when you get access. Store tokens server-side.</p>
    </Section>
  )
}
