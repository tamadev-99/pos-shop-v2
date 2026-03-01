"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Glass overlay backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-lg animate-fade-in" />
      {/* Glass panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg p-6",
          "bg-[#0f1019]/85 backdrop-blur-2xl",
          "rounded-2xl border border-white/[0.08]",
          "gradient-border glass-shimmer",
          "shadow-[0_16px_64px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "animate-scale-in",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground font-[family-name:var(--font-display)]", className)}
      {...props}
    />
  );
}

function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 p-1.5 rounded-xl text-muted-dim hover:text-foreground hover:bg-white/[0.06] transition-all duration-200 cursor-pointer backdrop-blur-sm"
    >
      <X size={16} />
    </button>
  );
}

export { Dialog, DialogHeader, DialogTitle, DialogClose };
