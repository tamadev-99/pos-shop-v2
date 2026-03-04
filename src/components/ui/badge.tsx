import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "destructive" | "warning" | "info" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-accent-muted text-accent border-accent/15",
  success: "bg-success-muted text-success border-success/15",
  destructive: "bg-destructive-muted text-destructive border-destructive/15",
  warning: "bg-warning-muted text-warning border-warning/15",
  info: "bg-info-muted text-info border-info/15",
  outline: "bg-transparent text-muted-foreground border-border",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border",
        "transition-colors duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeVariant };
