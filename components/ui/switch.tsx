"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = { checked?: boolean; onCheckedChange?: (v: boolean) => void; className?: string };
export function Switch({ checked=false, onCheckedChange, className }: Props) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn("h-6 w-10 rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-zinc-700", className)}
    >
      <span className={cn("block h-5 w-5 rounded-full bg-white translate-x-0.5 transition-transform", checked && "translate-x-4")} />
    </button>
  );
}