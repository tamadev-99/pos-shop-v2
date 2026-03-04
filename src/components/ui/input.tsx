import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-xl pl-10 pr-3.5 py-2 text-sm",
              "bg-input text-foreground",
              "border border-border",
              "shadow-[var(--shadow-sm)]",
              "placeholder:text-muted-foreground",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl px-3.5 py-2 text-sm",
          "bg-input text-foreground",
          "border border-border",
          "shadow-[var(--shadow-sm)]",
          "placeholder:text-muted-foreground",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
