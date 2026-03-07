"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, cn } from "@/lib/utils";

const CATEGORY_COLORS = [
    { bg: "bg-violet-500", ring: "#8b5cf6" },
    { bg: "bg-cyan-500", ring: "#06b6d4" },
    { bg: "bg-amber-500", ring: "#f59e0b" },
    { bg: "bg-rose-500", ring: "#f43f5e" },
    { bg: "bg-emerald-500", ring: "#10b981" },
    { bg: "bg-blue-500", ring: "#3b82f6" },
    { bg: "bg-orange-500", ring: "#f97316" },
    { bg: "bg-pink-500", ring: "#ec4899" },
];

interface CategoryPerformanceProps {
    data: { name: string; sales: number; qty: number }[];
}

export function CategoryPerformance({ data }: CategoryPerformanceProps) {
    const total = data.reduce((sum, d) => sum + d.sales, 0);

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Performa Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center py-6">
                        Belum ada data kategori minggu ini
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Calculate ring segments
    let cumulativeAngle = 0;
    const segments = data.map((d, i) => {
        const pct = total > 0 ? (d.sales / total) * 100 : 0;
        const startAngle = cumulativeAngle;
        cumulativeAngle += pct;
        return {
            ...d,
            pct,
            startAngle,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performa Kategori</CardTitle>
                <p className="text-[10px] text-muted-dim mt-0.5">7 hari terakhir</p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* SVG Donut Ring */}
                    <div className="relative w-36 h-36 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {segments.map((seg, i) => {
                                const radius = 38;
                                const circumference = 2 * Math.PI * radius;
                                const strokeLength = (seg.pct / 100) * circumference;
                                const gapSize = segments.length > 1 ? 2 : 0;
                                const offset = ((seg.startAngle / 100) * circumference) + (i * gapSize);
                                return (
                                    <circle
                                        key={seg.name}
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke={seg.color.ring}
                                        strokeWidth="8"
                                        strokeDasharray={`${Math.max(0, strokeLength - gapSize)} ${circumference}`}
                                        strokeDashoffset={-offset}
                                        strokeLinecap="round"
                                        className="transition-all duration-700"
                                        style={{ filter: `drop-shadow(0 0 4px ${seg.color.ring}40)` }}
                                    />
                                );
                            })}
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-[10px] text-muted-dim">Total</p>
                            <p className="text-sm font-bold font-num text-foreground">{formatRupiah(total)}</p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2 w-full">
                        {segments.map((seg) => (
                            <div key={seg.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", seg.color.bg)} />
                                    <span className="text-xs text-muted-foreground truncate">{seg.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-num font-medium text-foreground">
                                        {formatRupiah(seg.sales)}
                                    </span>
                                    <span className="text-[10px] font-num text-muted-dim w-9 text-right">
                                        {seg.pct.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
