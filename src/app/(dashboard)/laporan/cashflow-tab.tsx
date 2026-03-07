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
import { formatRupiah, cn } from "@/lib/utils";
import {
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Minus,
    Download,
    FileSpreadsheet,
    RefreshCw,
} from "lucide-react";
import { getCashFlowReport } from "@/lib/actions/finance";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-csv";
import { exportToExcel } from "@/lib/export-excel";

// ─── Types ──────────────────────────────────────────────

interface CashFlowData {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    inflows: { category: string; amount: number }[];
    outflows: { category: string; amount: number }[];
    dailyBreakdown: { date: string; inflow: number; outflow: number }[];
    transactionCount: number;
}

interface CashFlowTabProps {
    initialStartDate: string;
    initialEndDate: string;
}

// ─── Component ──────────────────────────────────────────

export function CashFlowTab({ initialStartDate, initialEndDate }: CashFlowTabProps) {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [data, setData] = useState<CashFlowData | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleFetch = () => {
        startTransition(async () => {
            try {
                const result = await getCashFlowReport(startDate, endDate);
                setData(result);
            } catch {
                toast.error("Gagal memuat laporan arus kas");
            }
        });
    };

    const handleExportCSV = () => {
        if (!data) return;
        const rows = [
            ...data.inflows.map((i) => ({ Tipe: "Masuk", Kategori: i.category, Jumlah: i.amount })),
            ...data.outflows.map((o) => ({ Tipe: "Keluar", Kategori: o.category, Jumlah: o.amount })),
            { Tipe: "---", Kategori: "TOTAL MASUK", Jumlah: data.totalInflow },
            { Tipe: "---", Kategori: "TOTAL KELUAR", Jumlah: data.totalOutflow },
            { Tipe: "---", Kategori: "NET ARUS KAS", Jumlah: data.netCashFlow },
        ];
        exportToCSV(rows, `arus_kas_${startDate}_${endDate}`, [
            { key: "Tipe", label: "Tipe" },
            { key: "Kategori", label: "Kategori" },
            { key: "Jumlah", label: "Jumlah (Rp)" },
        ]);
        toast.success("Laporan diexport ke CSV");
    };

    const handleExportExcel = () => {
        if (!data) return;
        const rows = [
            ...data.inflows.map((i) => ({ Tipe: "Masuk", Kategori: i.category, Jumlah: i.amount })),
            ...data.outflows.map((o) => ({ Tipe: "Keluar", Kategori: o.category, Jumlah: o.amount })),
            { Tipe: "---", Kategori: "TOTAL MASUK", Jumlah: data.totalInflow },
            { Tipe: "---", Kategori: "TOTAL KELUAR", Jumlah: data.totalOutflow },
            { Tipe: "---", Kategori: "NET ARUS KAS", Jumlah: data.netCashFlow },
        ];
        exportToExcel(rows, `arus_kas_${startDate}_${endDate}`, [
            { key: "Tipe", label: "Tipe" },
            { key: "Kategori", label: "Kategori" },
            { key: "Jumlah", label: "Jumlah (Rp)" },
        ]);
        toast.success("Laporan diexport ke Excel");
    };

    return (
        <div className="space-y-4">
            {/* Date Range Picker + Fetch */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Dari</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40 mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Sampai</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40 mt-1"
                            />
                        </div>
                        <Button onClick={handleFetch} disabled={isPending} className="gap-1.5">
                            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
                            {isPending ? "Memuat..." : "Tampilkan"}
                        </Button>
                        {data && (
                            <>
                                <Button variant="ghost" size="sm" onClick={handleExportCSV} className="gap-1">
                                    <Download size={14} />
                                    CSV
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleExportExcel} className="gap-1">
                                    <FileSpreadsheet size={14} />
                                    Excel
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!data && !isPending && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            Pilih rentang tanggal dan klik &quot;Tampilkan&quot; untuk melihat laporan arus kas
                        </p>
                    </CardContent>
                </Card>
            )}

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                    <ArrowDownLeft size={16} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Total Masuk</span>
                            </div>
                            <p className="text-xl font-bold font-num text-emerald-400">{formatRupiah(data.totalInflow)}</p>
                            <p className="text-[10px] text-muted-dim mt-1">{data.inflows.length} kategori</p>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                                    <ArrowUpRight size={16} className="text-rose-400" />
                                </div>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Total Keluar</span>
                            </div>
                            <p className="text-xl font-bold font-num text-rose-400">{formatRupiah(data.totalOutflow)}</p>
                            <p className="text-[10px] text-muted-dim mt-1">{data.outflows.length} kategori</p>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                    {data.netCashFlow > 0 ? (
                                        <TrendingUp size={16} className="text-emerald-400" />
                                    ) : data.netCashFlow < 0 ? (
                                        <TrendingDown size={16} className="text-rose-400" />
                                    ) : (
                                        <Minus size={16} className="text-muted-foreground" />
                                    )}
                                </div>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Net Arus Kas</span>
                            </div>
                            <p className={cn(
                                "text-xl font-bold font-num",
                                data.netCashFlow > 0 ? "text-emerald-400" : data.netCashFlow < 0 ? "text-rose-400" : "text-foreground"
                            )}>
                                {data.netCashFlow >= 0 ? "+" : ""}{formatRupiah(data.netCashFlow)}
                            </p>
                            <p className="text-[10px] text-muted-dim mt-1">{data.transactionCount} transaksi</p>
                        </Card>
                    </div>

                    {/* Inflow / Outflow Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Inflows */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowDownLeft size={16} className="text-emerald-400" />
                                    Uang Masuk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.inflows.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Tidak ada pemasukan</p>
                                ) : (
                                    data.inflows.map((item) => {
                                        const pct = data.totalInflow > 0 ? (item.amount / data.totalInflow) * 100 : 0;
                                        return (
                                            <div key={item.category} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">{item.category}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-num font-medium text-foreground">{formatRupiah(item.amount)}</span>
                                                        <span className="text-[10px] font-num text-muted-dim w-10 text-right">{pct.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Outflows */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowUpRight size={16} className="text-rose-400" />
                                    Uang Keluar
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.outflows.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Tidak ada pengeluaran</p>
                                ) : (
                                    data.outflows.map((item) => {
                                        const pct = data.totalOutflow > 0 ? (item.amount / data.totalOutflow) * 100 : 0;
                                        return (
                                            <div key={item.category} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">{item.category}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-num font-medium text-foreground">{formatRupiah(item.amount)}</span>
                                                        <span className="text-[10px] font-num text-muted-dim w-10 text-right">{pct.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Breakdown Chart */}
                    {data.dailyBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Arus Kas Harian</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1.5">
                                    {data.dailyBreakdown.map((day) => {
                                        const maxVal = Math.max(
                                            ...data.dailyBreakdown.map((d) => Math.max(d.inflow, d.outflow)),
                                            1
                                        );
                                        const inflowPct = (day.inflow / maxVal) * 100;
                                        const outflowPct = (day.outflow / maxVal) * 100;
                                        const dateLabel = new Date(day.date).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                        });
                                        return (
                                            <div key={day.date} className="flex items-center gap-2 group">
                                                <span className="text-[10px] font-num text-muted-dim w-12 shrink-0 text-right">
                                                    {dateLabel}
                                                </span>
                                                <div className="flex-1 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <div
                                                            className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(inflowPct, day.inflow > 0 ? 2 : 0)}%` }}
                                                        />
                                                        <span className="text-[9px] font-num text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            {formatRupiah(day.inflow)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div
                                                            className="h-2 bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(outflowPct, day.outflow > 0 ? 2 : 0)}%` }}
                                                        />
                                                        <span className="text-[9px] font-num text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            {formatRupiah(day.outflow)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] text-muted-foreground">Masuk</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        <span className="text-[10px] text-muted-foreground">Keluar</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
