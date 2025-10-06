import Nav from '@/components/ui/Nav'
import StartSit from '@/components/StartSit'

export default function Page() {
  return (
    <main
      className="
        min-h-screen text-zinc-100
        bg-[radial-gradient(1000px_200px_at_50%_10%,_rgba(16,185,129,0.25)_0%,_rgba(6,95,70,0.15)_60%,_rgba(0,0,0,1)_100%)]
        overflow-hidden
      "
    >
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <StartSit />
      </div>
    </main>
  )
}