import Link from "next/link";
import { ComponentProps } from "react";

type Props = ComponentProps<'a'> & {
  href: string;
  variant?: 'primary' | 'ghost';
};

const base =
  "inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-medium " +
  "transition duration-200 no-underline visited:text-current focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-emerald-400/45 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default function Button({
  href,
  children,
  variant = 'primary',
  className = '',
  ...rest
}: Props) {
  const styles =
    variant === 'primary'
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
      : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-[1.02]";

  return (
    <Link href={href} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </Link>
  );
}