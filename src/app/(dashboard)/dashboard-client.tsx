"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatNumber, cn } from "@/lib/utils";
import { TrendingUp, ShoppingCart, DollarSign, BarChart3, Package } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  avgTransaction: number;
  productsSold: number;
  weekData: { day: string; penjualan: number }[];
}

interface BestSeller {
  productName: string;
  totalQty: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: "pending" | "selesai" | "dibatalkan";
  createdAt: Date;
}

export interface DashboardClientProps {
  stats: DashboardStats;
  bestSellers: BestSeller[];
  recentOrders: RecentOrder[];
}

// ─── Helpers ─────────────────────────────────────────────

function formatShort(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return String(value);
}

const statusVariant = {
  selesai: "success" as const,
  dibatalkan: "destructive" as const,
  pending: "warning" as const,
};

// ─── Component ───────────────────────────────────────────

export default function DashboardClient({
  stats,
  bestSellers,
  recentOrders,
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statCards = [
    {
      label: "Penjualan Hari Ini",
      value: formatRupiah(stats.totalSales),
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(16,185,129,0.25)]",
    },
    {
      label: "Total Pesanan",
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(6,182,212,0.25)]",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatRupiah(stats.avgTransaction),
      icon: BarChart3,
      gradient: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(139,92,246,0.25)]",
    },
    {
      label: "Produk Terjual",
      value: formatNumber(stats.productsSold),
      icon: Package,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      glowColor: "shadow-[0_0_20px_-6px_rgba(245,158,11,0.25)]",
    },
  ];

  const maxSold = bestSellers.length > 0 ? bestSellers[0].totalQty : 1;

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
          Dashboard
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ringkasan penjualan dan aktivitas toko Anda
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger">
        {statCards.map((stat) => (
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
          </Card>
        ))}
      </div>

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        {/* Sales Chart */}
        <div className="lg:col-span-3 animate-fade-up">
          <Card>
            <CardHeader>
              <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] md:h-[280px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.weekData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="40%" stopColor="#06b6d4" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.03)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#525a6a", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#525a6a", fontSize: 11 }}
                        tickFormatter={formatShort}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15,16,25,0.9)",
                          backdropFilter: "blur(24px)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "14px",
                          fontSize: "12px",
                          color: "#f0f2f5",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                        formatter={(value) => [
                          `Rp ${Number(value).toLocaleString("id-ID")}`,
                          "Penjualan",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="penjualan"
                        stroke="url(#lineGradient)"
                        strokeWidth={2}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 animate-fade-up">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bestSellers.length > 0 ? (
                  bestSellers.slice(0, 5).map((product, index) => {
                    const percentage = maxSold > 0 ? (product.totalQty / maxSold) * 100 : 0;
                    return (
                      <div key={product.productName}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold font-num",
                                index === 0
                                  ? "bg-gradient-to-br from-accent/20 to-accent-secondary/20 text-accent shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]"
                                  : "bg-white/[0.05] text-muted-foreground"
                              )}
                            >
                              {index + 1}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {product.productName}
                            </span>
                          </div>
                          <span className="text-[11px] font-num text-muted-foreground">
                            {formatNumber(product.totalQty)} terjual
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent via-accent-secondary to-accent-tertiary transition-all duration-700 ease-out shadow-[0_0_8px_-2px_rgba(16,185,129,0.3)]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground font-num">
                          {order.id}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusVariant[order.status] || "outline"}>
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground font-num">
                          {formatRupiah(order.total)}
                        </p>
                        <p className="text-[10px] text-muted-dim font-num">
                          {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada pesanan hari ini</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
