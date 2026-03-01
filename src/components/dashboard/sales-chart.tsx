"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const data = [
  { day: "Sen", penjualan: 3200000 },
  { day: "Sel", penjualan: 4100000 },
  { day: "Rab", penjualan: 3800000 },
  { day: "Kam", penjualan: 5200000 },
  { day: "Jum", penjualan: 4700000 },
  { day: "Sab", penjualan: 6100000 },
  { day: "Min", penjualan: 4850000 },
];

function formatShort(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return String(value);
}

export function SalesChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] md:h-[280px] w-full">
          {mounted && <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="40%" stopColor="#06b6d4" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
                formatter={(value) => [
                  `Rp ${Number(value).toLocaleString("id-ID")}`,
                  "Penjualan",
                ]}
              />
              <Area
                type="monotone"
                dataKey="penjualan"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  );
}
