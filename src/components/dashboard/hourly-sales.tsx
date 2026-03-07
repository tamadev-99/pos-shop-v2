"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface HourlySalesProps {
    data: { hour: number; sales: number; orders: number }[];
}

export function HourlySales({ data }: HourlySalesProps) {
    const maxSales = Math.max(...data.map((d) => d.sales), 1);
    const peakHour = data.reduce((best, d) => (d.sales > best.sales ? d : best), data[0]);

    // Only show business hours with activity + surrounding context (6am - 11pm)
    const displayData = data.filter((d) => d.hour >= 6 && d.hour <= 22);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Penjualan per Jam</CardTitle>
                {peakHour && peakHour.sales > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Clock size={12} className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-amber-400">
                            Peak: {String(peakHour.hour).padStart(2, "0")}:00
                        </span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-[3px] h-[160px]">
                    {displayData.map((d) => {
                        const heightPct = maxSales > 0 ? (d.sales / maxSales) * 100 : 0;
                        const isPeak = d.hour === peakHour?.hour && d.sales > 0;
                        return (
                            <div
                                key={d.hour}
                                className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                            >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg px-2 py-1.5 text-center whitespace-nowrap shadow-xl">
                                        <p className="text-[10px] font-semibold text-foreground font-num">{formatRupiah(d.sales)}</p>
                                        <p className="text-[9px] text-muted-dim">{d.orders} pesanan</p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-full rounded-t-sm transition-all duration-500 relative overflow-hidden",
                                        isPeak
                                            ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_12px_-2px_rgba(245,158,11,0.5)]"
                                            : d.sales > 0
                                                ? "bg-gradient-to-t from-accent/80 to-accent shadow-[0_0_8px_-3px_rgba(16,185,129,0.3)]"
                                                : "bg-surface"
                                    )}
                                    style={{ height: `${Math.max(heightPct, d.sales > 0 ? 4 : 1)}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.15] rounded-t-sm" />
                                </div>
                                <span className={cn(
                                    "text-[8px] font-num font-medium",
                                    isPeak ? "text-amber-400" : "text-muted-dim"
                                )}>
                                    {String(d.hour).padStart(2, "0")}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
