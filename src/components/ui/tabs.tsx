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
        "flex gap-0.5 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06] backdrop-blur-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        "overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer",
            value === tab.value
              ? "bg-white/[0.08] text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          )}
        >
          {value === tab.value && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-accent to-accent-secondary shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { Tabs };
