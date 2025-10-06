import Nav from '@/components/ui/Nav'
import StartSit from '@/components/StartSit'

export default function Page(){
  return (
    <main>
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <StartSit />
      </div>
    </main>
  )
}
