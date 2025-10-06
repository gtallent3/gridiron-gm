export default function ConfidenceBar({ value }:{ value:number }) {
  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
