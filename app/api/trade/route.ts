import { NextRequest, NextResponse } from 'next/server'
import { roster, league } from '@/lib/mock'
export async function POST(req: NextRequest){
  const { giveId, getId } = await req.json()
  const pool = [...roster, ...league]
  const my = pool.find(p=>p.id===giveId), th = pool.find(p=>p.id===getId)
  if(!my || !th) return NextResponse.json({ error:'players not found' }, { status:400 })
  const delta = (th.val||0) - (my.val||0)
  const score = Math.max(0, Math.min(100, Math.round(50 + delta)))
  const verdict = score>=65? 'fleecing' : score>=45? 'fair' : 'losing'
  return NextResponse.json({ score, verdict })
}
