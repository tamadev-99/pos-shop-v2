"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SubscriptionStatusProps {
  status: "trial" | "active" | "expired";
  daysRemaining: number;
  expiryDate: Date | null;
}

export function SubscriptionStatus({ status, daysRemaining, expiryDate }: SubscriptionStatusProps) {
  const isNearExpiry = daysRemaining <= 7 && status !== "expired";
  const isTrial = status === "trial";
  
  const statusLabel = isTrial ? "Masa Trial" : status === "active" ? "Berlangganan" : "Kedaluwarsa";
  
  const statusColors = {
    trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    expired: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <Card className={cn(
      "p-3 md:p-4 border-l-4 overflow-hidden relative group transition-all duration-300",
      status === "trial" ? "border-l-amber-500" : status === "active" ? "border-l-emerald-500" : "border-l-rose-500",
      isNearExpiry && "animate-pulse shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
    )}>
      {/* Decorative background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12 transform scale-150">
        <CreditCard size={100} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
            status === "trial" ? "bg-amber-500/10" : status === "active" ? "bg-emerald-500/10" : "bg-rose-500/10"
          )}>
            {isTrial ? (
              <Clock size={20} className="text-amber-500" />
            ) : (
              <CreditCard size={20} className={status === "active" ? "text-emerald-500" : "text-rose-500"} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Status Layanan</h3>
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider h-5 px-1.5", statusColors[status])}>
                {statusLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "expired" ? (
                "Layanan Anda telah berakhir. Harap lakukan perpanjangan."
              ) : (
                <>
                  Berakhir pada <span className="text-foreground font-medium">{expiryDate ? new Date(expiryDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-muted-dim uppercase tracking-wider">Sisa Waktu</p>
            <p className={cn(
              "text-sm font-bold font-num mt-0.5",
              isNearExpiry ? "text-amber-500" : "text-foreground"
            )}>
              {daysRemaining} Hari
            </p>
          </div>
          
          <Link href="/subscription">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs font-medium transition-colors">
              Detail Langganan
              <ChevronRight size={14} className="text-muted-dim" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
