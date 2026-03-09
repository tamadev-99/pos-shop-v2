"use client";

import { Card } from "@/components/ui/card";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign, BarChart3, Package, Wallet, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalSales: number;
    totalOrders: number;
    avgTransaction: number;
    productsSold: number;
    yesterdaySales?: number;
    yesterdayOrderCount?: number;
    grossProfit?: number;
    uniqueCustomers?: number;
    newCustomers?: number;
    pendingPurchaseOrders?: number;
  };
}

function calcChange(today: number, yesterday: number): { pct: string; trend: "up" | "down" | "neutral" } {
  if (yesterday === 0 && today === 0) return { pct: "0%", trend: "neutral" };
  if (yesterday === 0) return { pct: "+100%", trend: "up" };
  const change = ((today - yesterday) / yesterday) * 100;
  if (Math.abs(change) < 0.5) return { pct: "0%", trend: "neutral" };
  return {
    pct: `${change > 0 ? "+" : ""}${change.toFixed(0)}%`,
    trend: change > 0 ? "up" : "down",
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const salesChange = calcChange(stats.totalSales, stats.yesterdaySales ?? 0);
  const ordersChange = calcChange(stats.totalOrders, stats.yesterdayOrderCount ?? 0);
  const profitMargin = stats.totalSales > 0 && stats.grossProfit
    ? `${((stats.grossProfit / stats.totalSales) * 100).toFixed(0)}% margin`
    : undefined;

  const displayStats = [
    {
      label: "Penjualan Hari Ini",
      value: formatRupiah(stats.totalSales),
      change: salesChange.pct,
      trend: salesChange.trend,
      icon: DollarSign,
      gradient: "from-violet-500/20 to-indigo-600/20",
      iconColor: "text-accent",
      glowColor: "shadow-[0_0_20px_-6px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Total Pesanan",
      value: formatNumber(stats.totalOrders),
      change: ordersChange.pct,
      trend: ordersChange.trend,
      icon: ShoppingCart,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(6,182,212,0.25)]",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatRupiah(stats.avgTransaction),
      trend: "neutral" as const,
      icon: BarChart3,
      gradient: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(139,92,246,0.25)]",
    },
    {
      label: "Produk Terjual",
      value: formatNumber(stats.productsSold),
      trend: "neutral" as const,
      icon: Package,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(245,158,11,0.25)]",
    },
    {
      label: "Laba Kotor",
      value: formatRupiah(stats.grossProfit ?? 0),
      subtitle: profitMargin,
      trend: "neutral" as const,
      icon: Wallet,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Pelanggan Hari Ini",
      value: formatNumber(stats.uniqueCustomers ?? 0),
      trend: "neutral" as const,
      icon: Users,
      gradient: "from-rose-500/20 to-pink-500/20",
      iconColor: "text-rose-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(244,63,94,0.25)]",
    },
    {
      label: "Pelanggan Baru",
      value: formatNumber(stats.newCustomers ?? 0),
      trend: "neutral" as const,
      icon: Users,
      gradient: "from-blue-500/20 to-sky-500/20",
      iconColor: "text-blue-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(59,130,246,0.25)]",
    },
    {
      label: "PO Pending",
      value: formatNumber(stats.pendingPurchaseOrders ?? 0),
      trend: "neutral" as const,
      icon: Package,
      gradient: "from-slate-500/20 to-gray-500/20",
      iconColor: "text-slate-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(100,116,139,0.25)]",
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
              {"subtitle" in stat && stat.subtitle && (
                <p className="text-[10px] text-muted-dim mt-0.5">{stat.subtitle}</p>
              )}
            </div>
            <div className={cn(
              "flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br shrink-0",
              stat.gradient,
              stat.glowColor
            )}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
          </div>
          {stat.change && (
            <div className="flex items-center gap-1.5 mt-2 md:mt-3">
              {stat.trend === "up" ? (
                <TrendingUp size={13} className="text-success" />
              ) : stat.trend === "down" ? (
                <TrendingDown size={13} className="text-destructive" />
              ) : (
                <Minus size={13} className="text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-[10px] md:text-[11px] font-semibold font-num",
                  stat.trend === "up"
                    ? "text-success"
                    : stat.trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                )}
              >
                {stat.change}
              </span>
              <span className="text-[10px] md:text-[11px] text-muted-dim hidden sm:inline">
                vs kemarin
              </span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

