export default function ConfidenceBar({ value }:{ value:number }) {
  const w = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-300 transition-[width] duration-500 ease-out" style={{ width: `${w}%` }} />
    </div>
  )
}
