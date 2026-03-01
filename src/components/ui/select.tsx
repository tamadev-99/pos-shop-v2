import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-xl px-3 py-2 pr-8 text-sm text-foreground",
            "bg-white/[0.04] backdrop-blur-xl",
            "border border-white/[0.08]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.1)]",
            "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
            "focus:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-all duration-300 cursor-pointer",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-dim pointer-events-none"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
