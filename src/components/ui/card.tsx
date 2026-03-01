import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "accent" | "success" | "warning" | "destructive";
  hover?: boolean;
}

const glowColors = {
  accent: "hover:shadow-[0_0_35px_-10px_rgba(16,185,129,0.2),0_8px_25px_-8px_rgba(0,0,0,0.3)]",
  success: "hover:shadow-[0_0_35px_-10px_rgba(16,185,129,0.2),0_8px_25px_-8px_rgba(0,0,0,0.3)]",
  warning: "hover:shadow-[0_0_35px_-10px_rgba(245,158,11,0.2),0_8px_25px_-8px_rgba(0,0,0,0.3)]",
  destructive: "hover:shadow-[0_0_35px_-10px_rgba(244,63,94,0.2),0_8px_25px_-8px_rgba(0,0,0,0.3)]",
};

function Card({ className, glow, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl text-card-foreground",
        "bg-white/[0.035] backdrop-blur-xl",
        "border border-white/[0.07]",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "gradient-border glass-shimmer",
        hover && [
          "transition-all duration-300 ease-out cursor-default",
          "hover:-translate-y-1 hover:border-white/[0.12]",
          "hover:bg-white/[0.05]",
        ],
        glow && glowColors[glow],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 pb-3", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-tight text-foreground font-[family-name:var(--font-display)]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
