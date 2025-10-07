"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-2xl font-medium transition-colors";
  const sizes = size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4";
  const variants =
    {
      default: "bg-emerald-600 hover:bg-emerald-500 text-white",
      outline: "border border-white/10 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/40",
      ghost: "text-zinc-300 hover:bg-white/5",
      destructive: "bg-rose-600 hover:bg-rose-500 text-white",
    }[variant] ?? "";

  return <button className={cn(base, sizes, variants, className)} {...props} />;
}