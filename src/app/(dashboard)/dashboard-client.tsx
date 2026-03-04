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
import { useTheme } from "@/components/providers/theme-provider";

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
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const statCards = [
    {
      label: "Penjualan Hari Ini",
      value: formatRupiah(stats.totalSales),
      icon: DollarSign,
      iconBg: "bg-violet-500/10 text-violet-500",
    },
    {
      label: "Total Pesanan",
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      iconBg: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Rata-rata Transaksi",
      value: formatRupiah(stats.avgTransaction),
      icon: BarChart3,
      iconBg: "bg-amber-500/10 text-amber-500",
    },
    {
      label: "Produk Terjual",
      value: formatNumber(stats.productsSold),
      icon: Package,
      iconBg: "bg-emerald-500/10 text-emerald-500",
    },
  ];

  const maxSold = bestSellers.length > 0 ? bestSellers[0].totalQty : 1;

  const isDark = theme === "dark";
  const chartColors = {
    gridColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    tickColor: isDark ? "#6b7280" : "#9ca3af",
    tooltipBg: isDark ? "rgba(17,19,24,0.95)" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
    tooltipText: isDark ? "#f0f1f5" : "#111827",
  };

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
          <Card key={stat.label} className="p-4 animate-fade-up" hover>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                  {stat.label}
                </p>
                <p className="text-xl md:text-2xl font-bold text-foreground font-num mt-1.5 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", stat.iconBg)}>
                <stat.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 stagger">
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
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartColors.gridColor}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.tickColor, fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.tickColor, fontSize: 11 }}
                        tickFormatter={formatShort}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: chartColors.tooltipText,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        }}
                        formatter={(value) => [
                          `Rp ${Number(value).toLocaleString("id-ID")}`,
                          "Penjualan",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="penjualan"
                        stroke="#8b5cf6"
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
                                  ? "bg-accent-muted text-accent"
                                  : "bg-surface text-muted-foreground"
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
                        <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
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
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface transition-all duration-200"
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
