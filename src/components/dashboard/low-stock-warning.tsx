"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LowStockItem {
    id: string;
    sku: string;
    stock: number;
    minStock: number;
    productName: string;
    color: string;
    size: string;
}

interface LowStockWarningProps {
    items: LowStockItem[];
}

export function LowStockWarning({ items }: LowStockWarningProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <Card className="border-amber-500/20">
            <CardHeader className="flex flex-row items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <CardTitle className="text-amber-500">
                    Stok Rendah ({items.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((item) => {
                    const isOut = item.stock <= 0;
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg border",
                                isOut
                                    ? "bg-destructive/5 border-destructive/20"
                                    : "bg-amber-500/5 border-amber-500/10"
                            )}
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                    {item.productName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {item.color} / {item.size} • SKU: {item.sku}
                                </p>
                            </div>
                            <Badge
                                variant={isOut ? "destructive" : "warning"}
                                className="shrink-0 ml-2"
                            >
                                {isOut ? "Habis" : `Sisa ${item.stock}`}
                            </Badge>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
