"use client";

import { cn } from "@/lib/utils";

const defaultCategories = [
  { id: "all", label: "Semua" },
  { id: "Pakaian Pria", label: "Pria" },
  { id: "Pakaian Wanita", label: "Wanita" },
  { id: "Hijab", label: "Hijab" },
  { id: "Sepatu", label: "Sepatu" },
  { id: "Tas", label: "Tas" },
  { id: "Aksesoris", label: "Aksesoris" },
];

interface CategoryBarProps {
  active: string;
  onChange: (id: string) => void;
  categories?: { id: string; label: string }[];
}

export function CategoryBar({ active, onChange, categories }: CategoryBarProps) {
  const cats = categories ?? defaultCategories;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {cats.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={cn(
            "shrink-0 rounded-xl px-4 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer",
            active === cat.id
              ? [
                  "bg-gradient-to-r from-accent to-accent-secondary text-white",
                  "shadow-[0_0_20px_-4px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
                  "border border-white/[0.1]",
                ]
              : [
                  "bg-white/[0.04] text-muted-foreground",
                  "border border-white/[0.06]",
                  "backdrop-blur-sm",
                  "hover:text-foreground hover:bg-white/[0.07] hover:border-white/[0.1]",
                ]
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
