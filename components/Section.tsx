export default function Section({ title, right, children }:{
  title:string; right?:React.ReactNode; children:React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/70 via-black/60 to-zinc-900/60 p-5 md:p-6 shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-zinc-100 font-semibold tracking-wide">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
