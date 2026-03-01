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
    "bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold",
    "shadow-[0_0_24px_-4px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
    "hover:shadow-[0_0_36px_-4px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]",
    "hover:brightness-110",
    "border border-white/[0.1]",
  ].join(" "),
  secondary: [
    "bg-white/[0.05] text-foreground border border-white/[0.08]",
    "backdrop-blur-xl",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    "hover:bg-white/[0.08] hover:border-white/[0.14]",
    "hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]",
  ].join(" "),
  ghost: [
    "text-muted-foreground",
    "hover:text-foreground hover:bg-white/[0.06]",
    "hover:backdrop-blur-sm",
  ].join(" "),
  destructive: [
    "bg-destructive/10 text-destructive border border-destructive/15",
    "backdrop-blur-sm",
    "shadow-[inset_0_1px_0_rgba(244,63,94,0.1)]",
    "hover:bg-destructive/20 hover:border-destructive/25",
    "hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.2),inset_0_1px_0_rgba(244,63,94,0.15)]",
  ].join(" "),
  outline: [
    "border border-white/[0.08] bg-white/[0.02] text-foreground",
    "backdrop-blur-sm",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    "hover:bg-white/[0.06] hover:border-white/[0.14]",
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
          "transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-40 disabled:pointer-events-none",
          "active:scale-[0.96]",
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
