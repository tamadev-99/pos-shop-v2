"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
    tunai: "Tunai",
    debit: "Debit",
    kredit: "Kartu Kredit",
    transfer: "Transfer",
    qris: "QRIS",
    ewallet: "E-Wallet",
};

const PAYMENT_COLORS: Record<string, string> = {
    tunai: "bg-emerald-500",
    debit: "bg-blue-500",
    kredit: "bg-purple-500",
    transfer: "bg-cyan-500",
    qris: "bg-amber-500",
    ewallet: "bg-rose-500",
};

interface PaymentBreakdownProps {
    data: Record<string, number>;
}

export function PaymentBreakdown({ data }: PaymentBreakdownProps) {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    if (entries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center py-6">
                        Belum ada transaksi hari ini
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Horizontal stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden bg-surface">
                    {entries.map(([method, amount]) => {
                        const pct = total > 0 ? (amount / total) * 100 : 0;
                        return (
                            <div
                                key={method}
                                className={cn("transition-all duration-500", PAYMENT_COLORS[method] || "bg-gray-500")}
                                style={{ width: `${pct}%` }}
                                title={`${PAYMENT_LABELS[method] || method}: ${formatRupiah(amount)}`}
                            />
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="space-y-2">
                    {entries.map(([method, amount]) => {
                        const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : "0";
                        return (
                            <div key={method} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2.5 h-2.5 rounded-full", PAYMENT_COLORS[method] || "bg-gray-500")} />
                                    <span className="text-xs text-muted-foreground">
                                        {PAYMENT_LABELS[method] || method}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-num font-medium text-foreground">
                                        {formatRupiah(amount)}
                                    </span>
                                    <span className="text-[10px] font-num text-muted-dim w-10 text-right">
                                        {pct}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
