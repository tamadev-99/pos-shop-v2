"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import React, { forwardRef, useState, useRef, useEffect } from "react";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: { label: string; value: string;[key: string]: any }[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, value, defaultValue, onChange, onValueChange, name, ...props }, ref) => {
    const cleanValue = (v: any) => {
      if (v === null || v === undefined) return "";
      return String(v).replace(/^["']|["']$/g, "");
    };

    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(() => cleanValue(value ?? defaultValue));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value !== undefined) setInternalValue(cleanValue(value));
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => String(opt.value) === internalValue);

    const handleSelect = (val: string) => {
      if (value === undefined) setInternalValue(val);
      setIsOpen(false);
      if (onChange) onChange({ target: { value: val, name } });
      if (onValueChange) onValueChange(val);
    };

    return (
      <div className={cn("relative", className)} ref={containerRef}>
        <div
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm",
            "bg-input border border-border text-foreground",
            "shadow-[var(--shadow-sm)]",
            "transition-all duration-200 select-none",
            props.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            isOpen
              ? "border-accent ring-2 ring-accent/20"
              : !props.disabled && "hover:border-border-strong"
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder || "Pilih opsi"}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200 shrink-0 ml-2",
              isOpen && "rotate-180"
            )}
          />
        </div>

        {isOpen && !props.disabled && (
          <div className="absolute z-[9999] mt-1.5 w-full origin-top rounded-xl border border-border bg-card-solid p-1 shadow-[var(--shadow-lg)] animate-fade-up">
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {options.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">Tidak ada opsi</div>
              ) : (
                options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors duration-150",
                      internalValue === String(opt.value)
                        ? "bg-accent-muted text-accent font-medium"
                        : "hover:bg-surface text-foreground"
                    )}
                  >
                    {internalValue === String(opt.value) && (
                      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                        <Check size={14} />
                      </span>
                    )}
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <select
          ref={ref}
          className="hidden"
          value={internalValue}
          name={name}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={props.disabled}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
