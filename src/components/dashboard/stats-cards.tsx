"use client";

import { Card } from "@/components/ui/card";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart3, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalSales: number;
    totalOrders: number;
    avgTransaction: number;
    productsSold: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const displayStats = [
    {
      label: "Penjualan Hari Ini",
      value: formatRupiah(stats.totalSales),
      change: "+0%", // can be dynamic later
      trend: "up" as const,
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Total Pesanan",
      value: formatNumber(stats.totalOrders),
      change: "+0%",
      trend: "up" as const,
      icon: ShoppingCart,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(6,182,212,0.25)]",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatRupiah(stats.avgTransaction),
      change: "0%",
      trend: "up" as const,
      icon: BarChart3,
      gradient: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(139,92,246,0.25)]",
    },
    {
      label: "Produk Terjual",
      value: formatNumber(stats.productsSold),
      change: "+0%",
      trend: "up" as const,
      icon: Package,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(245,158,11,0.25)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger">
      {displayStats.map((stat) => (
        <Card key={stat.label} className="p-3 md:p-4 animate-fade-up" hover>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                {stat.label}
              </p>
              <p className="text-lg md:text-2xl font-bold text-foreground font-num mt-1 md:mt-1.5 tracking-tight">
                {stat.value}
              </p>
            </div>
            <div className={cn(
              "flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br shrink-0",
              stat.gradient,
              stat.glowColor
            )}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 md:mt-3">
            {stat.trend === "up" ? (
              <TrendingUp size={13} className="text-success" />
            ) : (
              <TrendingDown size={13} className="text-destructive" />
            )}
            <span
              className={cn(
                "text-[10px] md:text-[11px] font-semibold font-num",
                stat.trend === "up" ? "text-success" : "text-destructive"
              )}
            >
              {stat.change}
            </span>
            <span className="text-[10px] md:text-[11px] text-muted-dim hidden sm:inline">
              vs kemarin
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
