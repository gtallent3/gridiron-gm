export default function Section({ title, right, children }:{
  title:string; right?:React.ReactNode; children:React.ReactNode
}) {
  return (
    <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-7 shadow-[0_0_25px_rgba(16,185,129,0.05)] hover:shadow-[0_0_35px_rgba(16,185,129,0.1)] transition hover:-translate-y-[1px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-zinc-100 font-semibold tracking-wide text-lg md:text-xl">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
