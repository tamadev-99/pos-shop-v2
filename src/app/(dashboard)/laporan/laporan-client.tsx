"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { formatRupiah, formatNumber, cn } from "@/lib/utils";
import { getDailySalesReport, getMonthlySalesReport } from "@/lib/actions/reports";
import { getProfitLossReport } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";
import { KeuanganTab, type KeuanganTabProps } from "./keuangan-tab";
import { exportToCSV } from "@/lib/export-csv";
import { exportToExcel } from "@/lib/export-excel";

// ─── Types ──────────────────────────────────────────────

interface BestSeller {
  productName: string;
  totalQty: number;
  totalRevenue: number;
}

interface DailySalesReport {
  date: string;
  totalSales: number;
  totalOrders: number;
  avgTransaction: number;
}

interface MonthlySalesReport {
  year: number;
  month: number;
  totalSales: number;
  totalOrders: number;
  dailyBreakdown: Record<string, { sales: number; orders: number }>;
}

interface InventoryValuation {
  totalValue: number;
  totalItems: number;
  totalSKUs: number;
}

interface PLReport {
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
}

export interface LaporanClientProps extends KeuanganTabProps {
  dailyReport: DailySalesReport;
  monthlyReport: MonthlySalesReport;
  bestSellers: BestSeller[];
  inventoryValuation: InventoryValuation;
}

// ─── Stat Card Definitions ───────────────────────────────

interface StatDef {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
}

function buildStats(
  monthlyReport: MonthlySalesReport,
  inventoryValuation: InventoryValuation
): StatDef[] {
  const avgTransaction =
    monthlyReport.totalOrders > 0
      ? Math.round(monthlyReport.totalSales / monthlyReport.totalOrders)
      : 0;

  return [
    {
      label: "Total Penjualan",
      value: formatRupiah(monthlyReport.totalSales),
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      gradient: "from-violet-500/20 to-indigo-600/20",
      shadow: "0 0 16px -4px rgba(16,185,129,0.4)",
    },
    {
      label: "Total Transaksi",
      value: formatNumber(monthlyReport.totalOrders),
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: "from-cyan-500/20 to-sky-500/20",
      shadow: "0 0 16px -4px rgba(6,182,212,0.4)",
    },
    {
      label: "Rata-rata / Transaksi",
      value: formatRupiah(avgTransaction),
      icon: (
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      gradient: "from-violet-500/20 to-purple-500/20",
      shadow: "0 0 16px -4px rgba(139,92,246,0.4)",
    },
    {
      label: "Nilai Inventaris",
      value: formatRupiah(inventoryValuation.totalValue),
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: "from-amber-500/20 to-orange-500/20",
      shadow: "0 0 16px -4px rgba(245,158,11,0.4)",
    },
  ];
}

// ─── Tab Definitions ─────────────────────────────────────

const TAB_OPTIONS = [
  { label: "Penjualan", value: "penjualan" },
  { label: "Produk", value: "produk" },
  { label: "Laba Rugi", value: "labarugi" },
  { label: "Keuangan", value: "keuangan" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2024, i).toLocaleString("id-ID", { month: "long" }),
  value: String(i + 1),
}));

// ─── Rank Badge Helper ───────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400/20 to-amber-500/20 text-yellow-400 text-xs font-bold border border-yellow-400/20 shadow-[0_0_10px_-3px_rgba(250,204,21,0.3)]">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-slate-300/15 to-gray-400/15 text-slate-300 text-xs font-bold border border-slate-300/20 shadow-[0_0_10px_-3px_rgba(203,213,225,0.2)]">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400/15 to-amber-600/15 text-orange-400 text-xs font-bold border border-orange-400/20 shadow-[0_0_10px_-3px_rgba(251,146,60,0.2)]">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-card text-muted-foreground text-xs font-medium border border-border">
      {rank}
    </span>
  );
}

// ─── Page Component ──────────────────────────────────────

export default function LaporanClient({
  dailyReport: initialDailyReport,
  monthlyReport: initialMonthlyReport,
  bestSellers,
  inventoryValuation,
  initialTransactions,
  saldoKas,
  todayReconciliation,
  todayReconciliationLog,
  expenseCategories,
  recurringExpenses,
}: LaporanClientProps) {
  const [activeTab, setActiveTab] = useState("penjualan");
  const [isPending, startTransition] = useTransition();

  // Stateful reports for date navigation
  const [dailyReport, setDailyReport] = useState(initialDailyReport);
  const [monthlyReport, setMonthlyReport] = useState(initialMonthlyReport);

  // Date selectors
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // P&L state
  const [plReport, setPlReport] = useState<PLReport | null>(null);
  const [plLoading, setPlLoading] = useState(false);
  const [plStartDate, setPlStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  );
  const [plEndDate, setPlEndDate] = useState(now.toISOString().split("T")[0]);

  const stats = buildStats(monthlyReport, inventoryValuation);

  function handleDateChange(date: string) {
    setSelectedDate(date);
    startTransition(async () => {
      try {
        const report = await getDailySalesReport(date);
        setDailyReport(report);
      } catch {
        toast.error("Gagal memuat laporan harian");
      }
    });
  }

  function handleMonthChange(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonth(month);
    startTransition(async () => {
      try {
        const report = await getMonthlySalesReport(year, month);
        setMonthlyReport(report);
      } catch {
        toast.error("Gagal memuat laporan bulanan");
      }
    });
  }

  async function handleFetchPL() {
    setPlLoading(true);
    try {
      const report = await getProfitLossReport(plStartDate, plEndDate);
      setPlReport(report);
    } catch {
      toast.error("Gagal memuat laporan laba rugi");
    } finally {
      setPlLoading(false);
    }
  }

  // Build daily breakdown data for chart
  const dailyBreakdownEntries = Object.entries(monthlyReport.dailyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  const dailySales = dailyBreakdownEntries.map(([, data]) => data.sales);
  const dayLabels = dailyBreakdownEntries.map(([dateStr]) => {
    const d = new Date(dateStr);
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return dayNames[d.getDay()];
  });
  const maxDaily = Math.max(...dailySales, 1);

  const totalQty = bestSellers.reduce((sum, p) => sum + p.totalQty, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Laporan &amp; Analitik
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Analisis performa penjualan dan produk toko Anda
          </p>
        </div>
        {/* Date selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "penjualan" && (
            <>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-36 text-xs h-8"
              />
              <Select
                options={MONTH_OPTIONS}
                value={String(selectedMonth)}
                onChange={(e) => handleMonthChange(selectedYear, Number(e.target.value))}
                className="w-28 text-xs"
              />
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => handleMonthChange(Number(e.target.value), selectedMonth)}
                className="w-20 text-xs h-8"
                min={2020}
                max={2030}
              />
              {isPending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </>
          )}
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 stagger">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
            hover
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: stat.shadow }}
            >
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider truncate">
                {stat.label}
              </p>
              <p className="text-lg md:text-xl font-bold font-num text-foreground truncate">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
        <Tabs tabs={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} className="w-fit" />
      </div>

      {/* ─── Tab Content ─── */}
      <div className="animate-fade-up" style={{ animationDelay: "350ms" }}>
        {activeTab === "penjualan" && (
          <PenjualanTab
            dailySales={dailySales}
            dayLabels={dayLabels}
            maxDaily={maxDaily}
            dailyReport={dailyReport}
          />
        )}
        {activeTab === "produk" && (
          <ProdukTab bestSellers={bestSellers} totalQty={totalQty} />
        )}
        {activeTab === "labarugi" && (
          <LabaRugiTab
            plReport={plReport}
            plLoading={plLoading}
            startDate={plStartDate}
            endDate={plEndDate}
            onStartDateChange={setPlStartDate}
            onEndDateChange={setPlEndDate}
            onFetch={handleFetchPL}
          />
        )}
        {activeTab === "keuangan" && (
          <KeuanganTab
            initialTransactions={initialTransactions}
            saldoKas={saldoKas}
            todayReconciliation={todayReconciliation}
            todayReconciliationLog={todayReconciliationLog}
            expenseCategories={expenseCategories}
            recurringExpenses={recurringExpenses}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Penjualan
// ═══════════════════════════════════════════════════════════

function PenjualanTab({
  dailySales,
  dayLabels,
  maxDaily,
  dailyReport,
}: {
  dailySales: number[];
  dayLabels: string[];
  maxDaily: number;
  dailyReport: DailySalesReport;
}) {
  return (
    <div className="space-y-4">
      {/* Today's Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ringkasan ({dailyReport.date})</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const data = dayLabels.map((day, i) => ({
                Hari: day,
                Penjualan: dailySales[i] || 0,
              }));
              exportToCSV(data, "penjualan_harian", [
                { key: "Hari", label: "Hari" },
                { key: "Penjualan", label: "Penjualan (Rp)" },
              ]);
              toast.success("Data penjualan diexport ke CSV");
            }}
          >
            <Download size={14} />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const data = dayLabels.map((day, i) => ({
                Hari: day,
                Penjualan: dailySales[i] || 0,
              }));
              exportToExcel(data, "penjualan_harian", [
                { key: "Hari", label: "Hari" },
                { key: "Penjualan", label: "Penjualan (Rp)" },
              ]);
              toast.success("Data diexport ke Excel");
            }}
          >
            <FileSpreadsheet size={14} />
            Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Penjualan</p>
              <p className="text-sm font-bold font-num text-foreground">{formatRupiah(dailyReport.totalSales)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Transaksi</p>
              <p className="text-sm font-bold font-num text-foreground">{formatNumber(dailyReport.totalOrders)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Rata-rata</p>
              <p className="text-sm font-bold font-num text-foreground">{formatRupiah(dailyReport.avgTransaction)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Sales Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Penjualan Harian (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySales.length > 0 ? (
            <>
              <div className="flex items-end justify-between gap-2 sm:gap-4 h-[220px] px-2">
                {dailySales.map((value, i) => {
                  const heightPct = (value / maxDaily) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-num text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        {formatRupiah(value)}
                      </span>
                      <div
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-accent to-accent-hover shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] group-hover:brightness-110 relative overflow-hidden"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.08] to-white/[0.15] rounded-t-lg" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {dayLabels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-3 px-2">
                <span className="text-[10px] text-muted-dim font-num">Rp 0</span>
                <span className="text-[10px] text-muted-dim font-num">{formatRupiah(maxDaily)}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Belum ada data penjualan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Produk
// ═══════════════════════════════════════════════════════════

function ProdukTab({
  bestSellers,
  totalQty,
}: {
  bestSellers: { productName: string; totalQty: number; totalRevenue: number }[];
  totalQty: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Produk Terlaris</CardTitle>
        {bestSellers.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const data = bestSellers.map((p, i) => ({
                  Rank: i + 1,
                  Produk: p.productName,
                  QtyTerjual: p.totalQty,
                  Revenue: p.totalRevenue,
                  PersenTotal: totalQty > 0 ? ((p.totalQty / totalQty) * 100).toFixed(1) + "%" : "0%",
                }));
                exportToCSV(data, "produk_terlaris", [
                  { key: "Rank", label: "#" },
                  { key: "Produk", label: "Nama Produk" },
                  { key: "QtyTerjual", label: "Qty Terjual" },
                  { key: "Revenue", label: "Revenue (Rp)" },
                  { key: "PersenTotal", label: "% dari Total" },
                ]);
                toast.success("Data produk terlaris diexport ke CSV");
              }}
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const data = bestSellers.map((p, i) => ({
                  Rank: i + 1,
                  Produk: p.productName,
                  QtyTerjual: p.totalQty,
                  Revenue: p.totalRevenue,
                  PersenTotal: totalQty > 0 ? ((p.totalQty / totalQty) * 100).toFixed(1) + "%" : "0%",
                }));
                exportToExcel(data, "produk_terlaris", [
                  { key: "Rank", label: "#" },
                  { key: "Produk", label: "Nama Produk" },
                  { key: "QtyTerjual", label: "Qty Terjual" },
                  { key: "Revenue", label: "Revenue (Rp)" },
                  { key: "PersenTotal", label: "% dari Total" },
                ]);
                toast.success("Data diexport ke Excel");
              }}
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {bestSellers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-left w-12">
                    #
                  </th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-left">
                    Nama Produk
                  </th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">
                    Qty Terjual
                  </th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">
                    Revenue
                  </th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">
                    % dari Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((product, i) => {
                  const rank = i + 1;
                  const pct = totalQty > 0 ? ((product.totalQty / totalQty) * 100).toFixed(1) : "0.0";
                  return (
                    <tr
                      key={product.productName}
                      className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
                    >
                      <td className="px-3 md:px-4 py-3">
                        <RankBadge rank={rank} />
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{product.productName}</span>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-right">
                        <span className="text-sm font-num text-foreground">{formatNumber(product.totalQty)}</span>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-right">
                        <span className="text-sm font-num text-foreground">{formatRupiah(product.totalRevenue)}</span>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-num text-muted-foreground w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Belum ada data produk terjual</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Laba Rugi (P&L)
// ═══════════════════════════════════════════════════════════

function LabaRugiTab({
  plReport,
  plLoading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetch,
}: {
  plReport: PLReport | null;
  plLoading: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onFetch: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Date range picker */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Dari</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-36 text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Sampai</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-36 text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-transparent">.</label>
              <Button size="sm" onClick={onFetch} disabled={plLoading} className="h-8">
                {plLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Tampilkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Report */}
      {plReport && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Laporan Laba Rugi</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!plReport) return;
                const data = [
                  { Item: "Total Pesanan", Nilai: plReport.orderCount },
                  { Item: "Pendapatan Kotor", Nilai: plReport.grossRevenue },
                  { Item: "Diskon", Nilai: -plReport.totalDiscounts },
                  { Item: "Pendapatan Bersih", Nilai: plReport.netRevenue },
                  { Item: "HPP (Harga Pokok Penjualan)", Nilai: -plReport.totalCOGS },
                  { Item: "Laba Kotor", Nilai: plReport.grossProfit },
                  { Item: "Total Beban", Nilai: -plReport.totalExpenses },
                  { Item: "Laba Bersih", Nilai: plReport.netProfit },
                ];
                exportToCSV(data, `laba_rugi_${startDate}_${endDate}`, [
                  { key: "Item", label: "Item" },
                  { key: "Nilai", label: "Nilai (Rp)" },
                ]);
                toast.success("Laporan laba rugi diexport ke CSV");
              }}
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!plReport) return;
                const data = [
                  { Item: "Total Pesanan", Nilai: plReport.orderCount },
                  { Item: "Pendapatan Kotor", Nilai: plReport.grossRevenue },
                  { Item: "Diskon", Nilai: -plReport.totalDiscounts },
                  { Item: "Pendapatan Bersih", Nilai: plReport.netRevenue },
                  { Item: "HPP (Harga Pokok Penjualan)", Nilai: -plReport.totalCOGS },
                  { Item: "Laba Kotor", Nilai: plReport.grossProfit },
                  { Item: "Total Beban", Nilai: -plReport.totalExpenses },
                  { Item: "Laba Bersih", Nilai: plReport.netProfit },
                ];
                exportToExcel(data, `laba_rugi_${startDate}_${endDate}`, [
                  { key: "Item", label: "Item" },
                  { key: "Nilai", label: "Nilai (Rp)" },
                ]);
                toast.success("Laporan diexport ke Excel");
              }}
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Pesanan</span>
                <span className="font-num font-medium text-foreground">{formatNumber(plReport.orderCount)}</span>
              </div>
              <div className="h-px bg-surface" />

              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Pendapatan Kotor</span>
                <span className="font-num text-accent">{formatRupiah(plReport.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>(-) Total Diskon</span>
                <span className="font-num">-{formatRupiah(plReport.totalDiscounts)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Pendapatan Bersih</span>
                <span className="font-num text-foreground">{formatRupiah(plReport.netRevenue)}</span>
              </div>
              <div className="h-px bg-surface" />

              <div className="flex justify-between text-rose-400">
                <span>(-) HPP (COGS)</span>
                <span className="font-num">-{formatRupiah(plReport.totalCOGS)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Laba Kotor</span>
                <span className={cn("font-num", plReport.grossProfit >= 0 ? "text-accent" : "text-rose-400")}>
                  {formatRupiah(plReport.grossProfit)}
                </span>
              </div>
              <div className="h-px bg-surface" />

              <div className="flex justify-between text-rose-400">
                <span>(-) Total Pengeluaran</span>
                <span className="font-num">-{formatRupiah(plReport.totalExpenses)}</span>
              </div>
              <div className="h-px bg-surface" />

              <div className="flex justify-between text-lg font-bold pt-1">
                <span className="text-foreground">Laba Bersih</span>
                <span className={cn("font-num", plReport.netProfit >= 0 ? "text-accent" : "text-rose-400")}>
                  {formatRupiah(plReport.netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!plReport && !plLoading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">Pilih rentang tanggal dan klik &quot;Tampilkan&quot;</p>
              <p className="text-xs text-muted-dim mt-1">untuk melihat laporan laba rugi</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
