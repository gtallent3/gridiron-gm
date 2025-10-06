export default function Badge({ children }:{ children:React.ReactNode }) {
  return <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{children}</span>
}
