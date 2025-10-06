type Props = { children: React.ReactNode; tone?: 'emerald'|'blue'|'zinc'; size?: 'sm'|'md' }
export default function Badge({ children, tone='emerald', size='sm' }: Props){
  const sizes = size==='md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
  const tones =
    tone==='emerald' ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/25' :
    tone==='blue'    ? 'bg-sky-500/12 text-sky-300 border border-sky-500/25' :
                       'bg-zinc-700/20 text-zinc-300 border border-zinc-600/30'
  return <span className={`rounded-full ${sizes} ${tones}`}>{children}</span>
}
