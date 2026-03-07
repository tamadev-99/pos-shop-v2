"use client";

import { useEffect, useState } from "react";
import {
    getPayablesSummary,
    getPayables,
    recordPayment
} from "@/lib/actions/payables";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function HutangTab() {
    const [summary, setSummary] = useState({ totalHutang: 0, count: 0, overdueCount: 0 });
    const [payables, setPayables] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Payment Dialog state
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<any>(null);
    const [payAmount, setPayAmount] = useState<string>("");
    const [payNote, setPayNote] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [sumData, listData] = await Promise.all([
                getPayablesSummary(),
                getPayables()
            ]);
            setSummary(sumData);
            setPayables(listData);
        } catch (error) {
            console.error("Failed to load payables data:", error);
            toast.error("Terjadi kesalahan saat mengambil data hutang", {
                description: error instanceof Error ? error.message : "Gagal memuat data",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openPaymentDialog = (po: any) => {
        setSelectedPO(po);
        setPayAmount((po.total - po.paidAmount).toString());
        setPayNote("");
        setIsPayDialogOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedPO || !payAmount) return;

        const amountNum = parseInt(payAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Jumlah tidak valid", {
                description: "Masukkan jumlah pembayaran yang valid",
            });
            return;
        }

        const sisaHutang = selectedPO.total - selectedPO.paidAmount;
        if (amountNum > sisaHutang) {
            toast.error("Jumlah melebihi sisa hutang", {
                description: `Maksimal pembayaran adalah ${formatRupiah(sisaHutang)}`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await recordPayment(selectedPO.id, amountNum, payNote);
            toast.success("Pembayaran Berhasil", {
                description: `Berhasil mencatat pembayaran untuk PO ${selectedPO.id}`,
            });
            setIsPayDialogOpen(false);
            loadData();
        } catch (error) {
            console.error("Payment failed:", error);
            toast.error("Pembayaran Gagal", {
                description: "Terjadi kesalahan saat mencatat pembayaran",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "belum_bayar":
                return <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80">Belum Bayar</span>;
            case "sebagian":
                return <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-orange-600 border-orange-600">Sebagian</span>;
            case "lunas":
                return <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-primary-foreground shadow bg-green-600 hover:bg-green-600/80">Lunas</span>;
            default:
                return <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{status}</span>;
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat data hutang...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary.totalHutang)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Dari {summary.count} tagihan aktif
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tagihan Aktif</CardTitle>
                        <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.count}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Purchase order yang belum lunas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jatuh Tempo</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{summary.overdueCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tagihan melewati batas waktu
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Hutang Supplier</CardTitle>
                    <CardDescription>Kelola tagihan yang harus dibayar ke supplier</CardDescription>
                </CardHeader>
                <CardContent>
                    {payables.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                            <CheckCircle2 className="h-12 w-12 text-primary/40 mb-3" />
                            <p>Tidak ada hutang aktif.</p>
                            <p className="text-sm">Semua tagihan supplier sudah lunas.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">No. PO</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Tgl Transaksi</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Jatuh Tempo</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Total Tagihan</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Sisa Hutang</th>
                                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payables.map((po) => {
                                        const sisa = po.total - po.paidAmount;
                                        const isOverdue = po.dueDate && po.dueDate < new Date().toISOString().split("T")[0];

                                        return (
                                            <tr key={po.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">{po.id}</td>
                                                <td className="p-4 align-middle">{po.supplier?.name || "Unknown CSR"}</td>
                                                <td className="p-4 align-middle">{new Date(po.date).toLocaleDateString("id-ID")}</td>
                                                <td className="p-4 align-middle">
                                                    <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                                        {po.dueDate ? new Date(po.dueDate).toLocaleDateString("id-ID") : "-"}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle">{getStatusBadge(po.paymentStatus)}</td>
                                                <td className="p-4 align-middle text-right">{formatRupiah(po.total)}</td>
                                                <td className="p-4 align-middle text-right font-bold text-orange-600">
                                                    {formatRupiah(sisa)}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openPaymentDialog(po)}
                                                    >
                                                        Bayar
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isPayDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80">
                    <div className="relative w-full max-w-lg p-4">
                        <div className="relative rounded-lg bg-background shadow flex flex-col sm:max-w-[425px] border">
                            <div className="flex flex-col space-y-1.5 text-center sm:text-left p-6">
                                <h3 className="text-lg font-semibold leading-none tracking-tight">Bayar Tagihan</h3>
                                <p className="text-sm text-muted-foreground">Catat pembayaran hutang untuk {selectedPO?.id}</p>
                            </div>
                            <div className="p-6 pt-0">
                                <div className="grid gap-4 py-4">
                                    <div className="bg-muted p-3 rounded-md flex justify-between text-sm">
                                        <span className="text-muted-foreground">Sisa Hutang:</span>
                                        <span className="font-bold text-orange-600">
                                            {selectedPO && formatRupiah(selectedPO.total - selectedPO.paidAmount)}
                                        </span>
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Jumlah Bayar (Rp)
                                        </label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={payAmount}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="note" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Catatan (Opsional)
                                        </label>
                                        <textarea
                                            id="note"
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={payNote}
                                            onChange={(e) => setPayNote(e.target.value)}
                                            placeholder="Keterangan pembayaran (mis. Transfer Mandiri an. Budi)"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0">
                                <Button variant="outline" onClick={() => setIsPayDialogOpen(false)} disabled={isSubmitting}>
                                    Batal
                                </Button>
                                <Button onClick={handlePayment} disabled={isSubmitting || !payAmount}>
                                    {isSubmitting ? "Menyimpan..." : "Konfirmasi Pembayaran"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
