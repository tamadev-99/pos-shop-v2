"use client";

import { useState } from "react";
import { getTaxReport } from "@/lib/actions/tax-report";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, FileSpreadsheet, Receipt } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-csv";
import { exportToExcel } from "@/lib/export-excel";

export function PajakTab() {
    const now = new Date();
    const [startDate, setStartDate] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFetch = async () => {
        setIsLoading(true);
        try {
            const data = await getTaxReport(startDate, endDate);
            setReport(data);
        } catch (error) {
            console.error("Failed to load tax report:", error);
            toast.error("Terjadi kesalahan saat mengambil data laporan pajak", {
                description: error instanceof Error ? error.message : "Gagal memuat laporan",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!report || report.monthlyReport.length === 0) return;

        const data = report.monthlyReport.map((row: any) => ({
            Bulan: row.month,
            TotalTransaksiKenaPajak: row.orderCount,
            DPP: row.dpp,
            PajakKeluar: row.tax,
            TotalPendapatanInklusifPajak: row.total,
        }));

        exportToCSV(data, `laporan_pajak_${startDate}_${endDate}`, [
            { key: "Bulan", label: "Bulan" },
            { key: "TotalTransaksiKenaPajak", label: "Jml Transaksi" },
            { key: "DPP", label: "DPP (Rp)" },
            { key: "PajakKeluar", label: "PPN Keluaran (Rp)" },
            { key: "TotalPendapatanInklusifPajak", label: "Total Pendapatan (Rp)" },
        ]);
        toast.success("Berhasil", { description: "Data diexport ke CSV" });
    };

    const handleExportExcel = () => {
        if (!report || report.monthlyReport.length === 0) return;

        const data = report.monthlyReport.map((row: any) => ({
            Bulan: row.month,
            TotalTransaksiKenaPajak: row.orderCount,
            DPP: row.dpp,
            PajakKeluar: row.tax,
            TotalPendapatanInklusifPajak: row.total,
        }));

        exportToExcel(data, `laporan_pajak_${startDate}_${endDate}`, [
            { key: "Bulan", label: "Bulan" },
            { key: "TotalTransaksiKenaPajak", label: "Jml Transaksi" },
            { key: "DPP", label: "DPP (Rp)" },
            { key: "PajakKeluar", label: "PPN Keluaran (Rp)" },
            { key: "TotalPendapatanInklusifPajak", label: "Total Pendapatan (Rp)" },
        ]);
        toast.success("Berhasil", { description: "Data diexport ke Excel" });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Dari</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-36 text-xs h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Sampai</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-36 text-xs h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-transparent">.</label>
                            <Button size="sm" onClick={handleFetch} disabled={isLoading} className="h-8">
                                {isLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {report && (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total PPN Keluaran</CardTitle>
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatRupiah(report.totalTax)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total pajak terkumpul dalam periode terpilih
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Transaksi Kena Pajak</CardTitle>
                                <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.taxableCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Jumlah transaksi yang dikenakan PPN
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Rekapitulasi Pajak per Bulan</CardTitle>
                                <CardDescription>Ringkasan PPN Keluaran (Pajak Pertambahan Nilai)</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                    <Download className="mr-2 h-4 w-4" /> CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {report.monthlyReport.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada data transaksi kena pajak pada periode ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Bulan</th>
                                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Jml Transaksi</th>
                                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">DPP (Dasar Pengenaan Pajak)</th>
                                                <th className="h-10 px-4 align-middle font-medium text-primary text-right font-bold">PPN Keluaran</th>
                                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Total Pendapatan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.monthlyReport.map((row: any) => (
                                                <tr key={row.month} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <td className="p-4 align-middle font-medium">{row.month}</td>
                                                    <td className="p-4 align-middle text-right">{row.orderCount}</td>
                                                    <td className="p-4 align-middle text-right">{formatRupiah(row.dpp)}</td>
                                                    <td className="p-4 align-middle text-right text-primary font-bold">
                                                        {formatRupiah(row.tax)}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">{formatRupiah(row.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!report && !isLoading && (
                <Card>
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <p className="text-sm">Pilih rentang tanggal dan klik "Tampilkan"</p>
                            <p className="text-xs text-muted-dim mt-1">untuk merekap PPN Keluaran (Pajak)</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
