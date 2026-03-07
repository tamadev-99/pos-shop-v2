"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyTrendProps {
    data: { month: string; sales: number; orders: number }[];
}

function formatShort(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
    return String(value);
}

export function MonthlyTrend({ data }: MonthlyTrendProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Calculate trend
    const lastMonth = data[data.length - 1]?.sales ?? 0;
    const prevMonth = data[data.length - 2]?.sales ?? 0;
    let trend: "up" | "down" | "neutral" = "neutral";
    let trendPct = "0%";
    if (prevMonth > 0) {
        const change = ((lastMonth - prevMonth) / prevMonth) * 100;
        if (Math.abs(change) >= 0.5) {
            trend = change > 0 ? "up" : "down";
            trendPct = `${change > 0 ? "+" : ""}${change.toFixed(0)}%`;
        }
    } else if (lastMonth > 0) {
        trend = "up";
        trendPct = "+100%";
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Tren Pendapatan Bulanan</CardTitle>
                    <p className="text-[10px] text-muted-dim mt-0.5">6 bulan terakhir</p>
                </div>
                <div className="flex items-center gap-1.5">
                    {trend === "up" ? (
                        <TrendingUp size={14} className="text-success" />
                    ) : trend === "down" ? (
                        <TrendingDown size={14} className="text-destructive" />
                    ) : (
                        <Minus size={14} className="text-muted-foreground" />
                    )}
                    <span className={`text-xs font-semibold font-num ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
                        }`}>
                        {trendPct}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    {mounted && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="40%" stopColor="#a78bfa" stopOpacity={0.08} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="monthlyLineGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="50%" stopColor="#a78bfa" />
                                        <stop offset="100%" stopColor="#c4b5fd" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="month"
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
                                    formatter={(value: any, name: any) => {
                                        if (name === "sales") return [formatRupiah(Number(value ?? 0)), "Pendapatan"];
                                        return [String(value ?? 0), name];
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="url(#monthlyLineGrad)"
                                    strokeWidth={2.5}
                                    fill="url(#monthlyGradient)"
                                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "#a78bfa", strokeWidth: 2, stroke: "#1a1b2e" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xs text-muted-foreground">Belum ada data</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
