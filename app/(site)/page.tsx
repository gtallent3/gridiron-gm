import Nav from '@/components/ui/Nav'
import Button from '@/components/ui/Button'

export default function Page() {
  return (
    <main>
      <Nav />
      <header className="relative overflow-hidden bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(16,185,129,0.3),transparent_70%)]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/90" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-100">
              Gridiron GM — <span className="text-emerald-300">Win Every Sunday</span>
            </h1>
            <p className="mt-4 text-zinc-400 text-lg">
              Start/Sit, trade fairness, weekly rankings, league sync, and contests.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/startsit">Launch Start/Sit</Button>
              <Button href="/trade" variant="ghost">Try Trade Analyzer</Button>
            </div>
          </div>
        </div>
      </header>
    </main>
  )
}