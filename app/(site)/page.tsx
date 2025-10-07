import Link from "next/link";
import Nav from "@/components/ui/nav";

export default function Page() {
  return (
    <main
      className="
        min-h-screen text-zinc-100
        bg-[radial-gradient(1000px_200px_at_50%_10%,_rgba(16,185,129,0.25)_0%,_rgba(6,95,70,0.15)_60%,_rgba(0,0,0,1)_100%)]
        overflow-hidden
      "
    >
      <Nav />

      <header className="relative flex flex-col items-center justify-center text-center px-6 py-40">
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          Gridiron GM — Win Every Sunday
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-14">
          Start/Sit, trade fairness, weekly rankings, league sync, and contests.
        </p>

        <div className="flex justify-center space-x-[6rem]">
          <Link
            href="/startsit"
            className="
              px-[6rem] py-[4rem] text-2xl rounded-[28px] border border-emerald-500/40 
              bg-emerald-500/15 text-emerald-300 font-semibold
              bg-zinc-200 text-zinc-900
              hover:bg-zinc-300 hover:border-emerald-300 hover:text-black
              transition duration-300
              shadow-[0_0_25px_rgba(16,185,129,0.25)]
              hover:shadow-[0_0_35px_rgba(16,185,129,0.40)]
            "
          >
            Launch Start/Sit
          </Link>
          <Link
            href="/trade"
            className="
              px-[6rem] py-[4rem] text-2xl rounded-[28px] border border-sky-500/40 
              bg-sky-500/15 text-sky-300 font-semibold
              bg-zinc-200 text-zinc-900
              hover:bg-zinc-300 hover:border-sky-300 hover:text-black
              transition duration-300
              shadow-[0_0_25px_rgba(56,189,248,0.25)]
              hover:shadow-[0_0_35px_rgba(56,189,248,0.40)]
      "
          >
            Try Trade Analyzer
          </Link>
        </div>
      </header>
    </main>
  );
}