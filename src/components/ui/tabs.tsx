"use client";

import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-0.5 rounded-xl bg-surface p-1 border border-border",
        "overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
            value === tab.value
              ? "bg-accent text-accent-foreground shadow-[var(--shadow-sm)]"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { Tabs };
