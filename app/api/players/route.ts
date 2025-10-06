import { NextResponse } from 'next/server'
import { players } from '@/lib/mock'
export async function GET(){ return NextResponse.json({ players }) }
