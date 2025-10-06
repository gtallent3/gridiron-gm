import Link from 'next/link'
import Button from './Button'

export default function Nav(){
  return (
    <nav className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-zinc-900">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline text-zinc-100 visited:text-zinc-100">
          <div className="w-7 h-7 rounded-xl bg-emerald-400/20 border border-emerald-500/30 grid place-items-center text-emerald-300 font-bold">GG</div>
          <span className="font-semibold tracking-wide">Gridiron GM</span>
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link className="text-zinc-400 hover:text-zinc-200 no-underline visited:text-zinc-200" href="/startsit">Start/Sit</Link>
          <Link className="text-zinc-400 hover:text-zinc-200 no-underline visited:text-zinc-200" href="/trade">Trade</Link>
          <Link className="text-zinc-400 hover:text-zinc-200 no-underline visited:text-zinc-200" href="/rankings">Rankings</Link>
          <Link className="text-zinc-400 hover:text-zinc-200 no-underline visited:text-zinc-200" href="/league">League Sync</Link>
        </div>
        <Button href="/pro">Go Pro</Button>
      </div>
    </nav>
  )
}