import { NextResponse } from 'next/server'
import { roster } from '@/lib/mock'
export async function GET(){ return NextResponse.json({ roster }) }
