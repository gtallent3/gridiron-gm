import Nav from '@/components/ui/nav'
import LeagueSync from '@/components/LeagueSync'
export default function Page(){
  return (
    <main>
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <LeagueSync />
      </div>
    </main>
  )
}
