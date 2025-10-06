import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest){
  const { platform, identifier, token } = await req.json()
  if(!platform || !identifier) return NextResponse.json({ ok:false, error:'missing fields' }, { status:400 })
  return NextResponse.json({ ok:true, platform, identifier, kind:'mock-connection' })
}
