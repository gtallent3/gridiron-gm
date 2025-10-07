"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  value, onValueChange, children, className,
}: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-2", className)} data-value={value}>{children}</div>;
}

export function TabsList({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-xl bg-zinc-900/60 p-1 border border-white/10", className)}>{children}</div>;
}

export function TabsTrigger({
  value, children, className, onClick,
}: { value: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      data-value={value}
      className={cn(
        "px-3 h-9 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5",
        "data-[active=true]:bg-zinc-800 data-[active=true]:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}