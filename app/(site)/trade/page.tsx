import Nav from '@/components/ui/nav'
import TradeAnalyzer from '@/components/TradeAnalyzer'
export default function Page(){
  return (
    <main
      className="
        min-h-screen text-zinc-100
        bg-[radial-gradient(1000px_200px_at_50%_10%,_rgba(16,185,129,0.25)_0%,_rgba(6,95,70,0.15)_60%,_rgba(0,0,0,1)_100%)]
        overflow-hidden
      "
    >
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <TradeAnalyzer />
      </div>
    </main>
  )
}
