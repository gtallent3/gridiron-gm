import { NextRequest, NextResponse } from 'next/server'
import { weekly } from '@/lib/mock'
export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url)
  const pos = (searchParams.get('pos')||'WR').toUpperCase()
  const week = Number(searchParams.get('week')||'1')
  const data = (weekly as any)[pos] || []
  return NextResponse.json({ pos, week, rankings: data })
}
