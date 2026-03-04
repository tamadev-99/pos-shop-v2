import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: [
    "bg-accent text-accent-foreground font-semibold",
    "shadow-[var(--shadow-sm)]",
    "hover:bg-accent-hover hover:shadow-[var(--shadow-md)]",
    "border border-accent/20",
  ].join(" "),
  secondary: [
    "bg-surface text-foreground border border-border",
    "hover:bg-surface-hover hover:border-border-strong",
    "shadow-[var(--shadow-sm)]",
  ].join(" "),
  ghost: [
    "text-muted-foreground",
    "hover:text-foreground hover:bg-surface",
  ].join(" "),
  destructive: [
    "bg-destructive-muted text-destructive border border-destructive/15",
    "hover:bg-destructive/20 hover:border-destructive/25",
    "shadow-[var(--shadow-sm)]",
  ].join(" "),
  outline: [
    "border border-border bg-transparent text-foreground",
    "hover:bg-surface hover:border-border-strong",
    "shadow-[var(--shadow-sm)]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium cursor-pointer",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-40 disabled:pointer-events-none",
          "active:scale-[0.97]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
