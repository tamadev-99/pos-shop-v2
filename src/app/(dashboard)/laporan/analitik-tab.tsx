"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatNumber, cn } from "@/lib/utils";
import {
  getSalesByHourReport,
  getProductTrends,
  getProfitMarginReport,
  getCustomerFrequencyReport,
} from "@/lib/actions/reports";
import { toast } from "sonner";
import { Loader2, BarChart3, TrendingUp, PieChart, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ─── Color Palette ──────────────────────────────────────

const CHART_COLORS = [
  "#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// ─── Types ──────────────────────────────────────────────

interface HeatmapData {
  matrix: { sales: number; orders: number }[][];
}

interface ProductTrendsData {
  products: string[];
  series: { productName: string; data: { date: string; sales: number; qty: number }[] }[];
}

interface ProfitMarginData {
  categories: {
    categoryName: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPct: number;
    totalQty: number;
    totalOrders: number;
  }[];
  totals: { revenue: number; cogs: number; grossProfit: number; marginPct: number };
}

interface CustomerFrequencyData {
  customers: {
    customerId: string;
    customerName: string;
    totalOrders: number;
    avgDaysBetween: number | null;
    firstOrder: string;
    lastOrder: string;
  }[];
  summary: {
    totalCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    avgOrdersPerCustomer: number;
  };
}

// ─── Main Component ─────────────────────────────────────

export function AnalitikTab() {
  return (
    <div className="space-y-6">
      <HeatmapSection />
      <ProductTrendsSection />
      <ProfitMarginSection />
      <CustomerFrequencySection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Section: Sales by Hour Heatmap
// ═══════════════════════════════════════════════════════════

function HeatmapSection() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await getSalesByHourReport();
      setData(result);
    } catch {
      toast.error("Gagal memuat data heatmap penjualan");
    } finally {
      setLoading(false);
    }
  }

  // Find max for color scaling
  const maxSales = data
    ? Math.max(...data.matrix.flat().map((c) => c.sales), 1)
    : 1;

  function getCellColor(sales: number): string {
    if (sales === 0) return "bg-surface";
    const intensity = sales / maxSales;
    if (intensity < 0.2) return "bg-emerald-500/15";
    if (intensity < 0.4) return "bg-emerald-500/30";
    if (intensity < 0.6) return "bg-emerald-500/50";
    if (intensity < 0.8) return "bg-emerald-500/70";
    return "bg-emerald-500/90";
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <BarChart3 size={16} className="text-emerald-400" />
          </div>
          <div>
            <CardTitle>Heatmap Penjualan per Jam</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Data 30 hari terakhir, per hari dan jam
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {data ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="overflow-x-auto">
            {/* Hour labels */}
            <div className="flex gap-0.5 mb-1 ml-10">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="w-8 h-5 flex items-center justify-center text-[9px] text-muted-foreground font-num"
                >
                  {String(h).padStart(2, "0")}
                </div>
              ))}
            </div>
            {/* Rows: days */}
            {data.matrix.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-9 text-[10px] text-muted-foreground font-medium shrink-0 text-right pr-1">
                  {DAY_NAMES[dayIdx]}
                </div>
                {row.map((cell, hourIdx) => (
                  <div
                    key={hourIdx}
                    className={cn(
                      "w-8 h-7 rounded-sm transition-all duration-200 cursor-default group relative",
                      getCellColor(cell.sales)
                    )}
                    title={`${DAY_NAMES[dayIdx]} ${String(hourIdx).padStart(2, "0")}:00 — ${formatRupiah(cell.sales)} (${cell.orders} transaksi)`}
                  />
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[9px] text-muted-foreground">Rendah</span>
              <div className="flex gap-0.5">
                <div className="w-5 h-3 rounded-sm bg-surface" />
                <div className="w-5 h-3 rounded-sm bg-emerald-500/15" />
                <div className="w-5 h-3 rounded-sm bg-emerald-500/30" />
                <div className="w-5 h-3 rounded-sm bg-emerald-500/50" />
                <div className="w-5 h-3 rounded-sm bg-emerald-500/70" />
                <div className="w-5 h-3 rounded-sm bg-emerald-500/90" />
              </div>
              <span className="text-[9px] text-muted-foreground">Tinggi</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Klik &quot;Generate&quot; untuk melihat heatmap penjualan</p>
            <p className="text-xs text-muted-dim mt-1">Menampilkan pola penjualan berdasarkan hari dan jam</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Section: Product Performance Trends
// ═══════════════════════════════════════════════════════════

function ProductTrendsSection() {
  const [data, setData] = useState<ProductTrendsData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await getProductTrends(30);
      setData(result);
    } catch {
      toast.error("Gagal memuat data tren produk");
    } finally {
      setLoading(false);
    }
  }

  // Transform data for Recharts LineChart
  const chartData = data
    ? (() => {
        if (data.series.length === 0) return [];
        const dates = data.series[0].data.map((d) => d.date);
        return dates.map((date, i) => {
          const point: Record<string, string | number> = {
            date: date.slice(5), // "MM-DD"
          };
          for (const s of data.series) {
            point[s.productName] = s.data[i]?.sales ?? 0;
          }
          return point;
        });
      })()
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <TrendingUp size={16} className="text-cyan-400" />
          </div>
          <div>
            <CardTitle>Tren Performa Produk</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Top 10 produk, penjualan harian 30 hari terakhir
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {data ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          data.series.length > 0 ? (
            <div className="w-full">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    tickLine={false}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`;
                      return String(v);
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatRupiah(value as number), undefined]}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={(label: any) => `Tanggal: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                  />
                  {data.products.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">Belum ada data produk</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <TrendingUp size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Klik &quot;Generate&quot; untuk melihat tren produk</p>
            <p className="text-xs text-muted-dim mt-1">Membandingkan performa 10 produk teratas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Section: Profit Margin Analysis
// ═══════════════════════════════════════════════════════════

function ProfitMarginSection() {
  const [data, setData] = useState<ProfitMarginData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await getProfitMarginReport();
      setData(result);
    } catch {
      toast.error("Gagal memuat analisis margin keuntungan");
    } finally {
      setLoading(false);
    }
  }

  const chartData = data
    ? data.categories.map((c) => ({
        name: c.categoryName,
        revenue: c.revenue,
        cogs: c.cogs,
        profit: c.grossProfit,
        margin: c.marginPct,
      }))
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <PieChart size={16} className="text-violet-400" />
          </div>
          <div>
            <CardTitle>Analisis Margin Keuntungan</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Revenue, HPP, dan margin per kategori
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {data ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-4">
            {/* Overall totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                <p className="text-sm font-bold font-num text-foreground">{formatRupiah(data.totals.revenue)}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total HPP</p>
                <p className="text-sm font-bold font-num text-rose-400">{formatRupiah(data.totals.cogs)}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Laba Kotor</p>
                <p className="text-sm font-bold font-num text-emerald-400">{formatRupiah(data.totals.grossProfit)}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margin Keseluruhan</p>
                <p className="text-sm font-bold font-num text-foreground">{data.totals.marginPct}%</p>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 48)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    tickFormatter={(v: number) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`;
                      return String(v);
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      const label = name === "revenue" ? "Revenue" : name === "cogs" ? "HPP" : "Laba";
                      return [formatRupiah(value as number), label];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="cogs" name="HPP" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="profit" name="Laba" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-left">Kategori</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Revenue</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">HPP</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Laba Kotor</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Margin</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((cat) => (
                    <tr key={cat.categoryName} className="border-b border-border hover:bg-white/[0.025] transition-colors">
                      <td className="px-3 py-2.5 text-sm font-medium text-foreground">{cat.categoryName}</td>
                      <td className="px-3 py-2.5 text-sm font-num text-foreground text-right">{formatRupiah(cat.revenue)}</td>
                      <td className="px-3 py-2.5 text-sm font-num text-rose-400 text-right">{formatRupiah(cat.cogs)}</td>
                      <td className="px-3 py-2.5 text-sm font-num text-emerald-400 text-right">{formatRupiah(cat.grossProfit)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn(
                          "text-xs font-num font-medium px-1.5 py-0.5 rounded",
                          cat.marginPct >= 30 ? "bg-emerald-500/15 text-emerald-400" :
                          cat.marginPct >= 15 ? "bg-amber-500/15 text-amber-400" :
                          "bg-rose-500/15 text-rose-400"
                        )}>
                          {cat.marginPct}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-num text-muted-foreground text-right">{formatNumber(cat.totalQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <PieChart size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Klik &quot;Generate&quot; untuk melihat analisis margin</p>
            <p className="text-xs text-muted-dim mt-1">Membantu mengidentifikasi kategori paling menguntungkan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Section: Customer Purchase Frequency
// ═══════════════════════════════════════════════════════════

function CustomerFrequencySection() {
  const [data, setData] = useState<CustomerFrequencyData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await getCustomerFrequencyReport();
      setData(result);
    } catch {
      toast.error("Gagal memuat data frekuensi pelanggan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Users size={16} className="text-amber-400" />
          </div>
          <div>
            <CardTitle>Frekuensi Pembelian Pelanggan</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Rata-rata interval dan tingkat repeat order
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {data ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pelanggan</p>
                <p className="text-sm font-bold font-num text-foreground">{formatNumber(data.summary.totalCustomers)}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pelanggan Repeat</p>
                <p className="text-sm font-bold font-num text-emerald-400">{formatNumber(data.summary.repeatCustomers)}</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Repeat Rate</p>
                <p className="text-sm font-bold font-num text-foreground">{data.summary.repeatRate}%</p>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rata-rata Order/Pelanggan</p>
                <p className="text-sm font-bold font-num text-foreground">{data.summary.avgOrdersPerCustomer}x</p>
              </div>
            </div>

            {/* Customer Table */}
            {data.customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-left">Pelanggan</th>
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Total Order</th>
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Rata-rata Interval</th>
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Order Pertama</th>
                      <th className="px-3 py-2.5 text-[10px] font-semibold text-muted-dim uppercase tracking-wider text-right">Order Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((cust) => (
                      <tr key={cust.customerId} className="border-b border-border hover:bg-white/[0.025] transition-colors">
                        <td className="px-3 py-2.5 text-sm font-medium text-foreground">{cust.customerName}</td>
                        <td className="px-3 py-2.5 text-sm font-num text-foreground text-right">{cust.totalOrders}</td>
                        <td className="px-3 py-2.5 text-right">
                          {cust.avgDaysBetween !== null ? (
                            <span className={cn(
                              "text-xs font-num font-medium px-1.5 py-0.5 rounded",
                              cust.avgDaysBetween <= 7 ? "bg-emerald-500/15 text-emerald-400" :
                              cust.avgDaysBetween <= 30 ? "bg-amber-500/15 text-amber-400" :
                              "bg-rose-500/15 text-rose-400"
                            )}>
                              {cust.avgDaysBetween} hari
                            </span>
                          ) : (
                            <span className="text-xs text-muted-dim">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-num text-muted-foreground text-right">{cust.firstOrder}</td>
                        <td className="px-3 py-2.5 text-xs font-num text-muted-foreground text-right">{cust.lastOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Belum ada data pelanggan
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Klik &quot;Generate&quot; untuk melihat data frekuensi pelanggan</p>
            <p className="text-xs text-muted-dim mt-1">Menganalisis pola pembelian dan loyalitas pelanggan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
