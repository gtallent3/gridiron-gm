import Nav from '@/components/ui/Nav'
import Rankings from '@/components/Rankings'
export default function Page(){
  return (
    <main>
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <Rankings />
      </div>
    </main>
  )
}
