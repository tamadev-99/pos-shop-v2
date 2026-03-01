import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-accent/10 text-accent backdrop-blur-sm border border-accent/10 shadow-[0_0_12px_-4px_rgba(16,185,129,0.15)]",
  success: "bg-success/10 text-success backdrop-blur-sm border border-success/10 shadow-[0_0_12px_-4px_rgba(16,185,129,0.15)]",
  warning: "bg-warning/10 text-warning backdrop-blur-sm border border-warning/10 shadow-[0_0_12px_-4px_rgba(245,158,11,0.15)]",
  destructive: "bg-destructive/10 text-destructive backdrop-blur-sm border border-destructive/10 shadow-[0_0_12px_-4px_rgba(244,63,94,0.15)]",
  outline: "bg-white/[0.04] text-muted-foreground backdrop-blur-sm border border-white/[0.08]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-accent shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  success: "bg-success shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  warning: "bg-warning shadow-[0_0_6px_rgba(245,158,11,0.5)]",
  destructive: "bg-destructive shadow-[0_0_6px_rgba(244,63,94,0.5)]",
  outline: "bg-muted-foreground",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      {props.children}
    </span>
  );
}

export { Badge };
export type { BadgeVariant };
