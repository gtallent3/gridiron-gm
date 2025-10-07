"use client";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">
          {/* Left: brand + primary links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-zinc-100 hover:text-emerald-400"
            >
              Gridiron GM
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link className="text-zinc-400 hover:text-zinc-200" href="/startsit">
                Start/Sit
              </Link>
              <Link className="text-zinc-400 hover:text-zinc-200" href="/trade">
                Trade Analyzer
              </Link>
              <Link className="text-zinc-400 hover:text-zinc-200" href="/league">
                League Sync
              </Link>
            </div>
          </div>

          {/* Right: CTA */}
          <Link
            href="/pro"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-600 px-4 font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Go Pro
          </Link>
        </div>
      </div>
    </nav>
  );
}