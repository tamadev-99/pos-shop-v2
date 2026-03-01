import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dim">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-xl px-3 py-2 text-sm text-foreground",
            "bg-white/[0.04] backdrop-blur-xl",
            "border border-white/[0.08]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.1)]",
            "placeholder:text-muted-dim",
            "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
            "focus:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]",
            "focus:bg-white/[0.06]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-all duration-300",
            icon && "pl-9",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
