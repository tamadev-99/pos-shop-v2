"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface TopProduct {
  name: string;
  sold: number;
  percentage: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold font-num",
                      index === 0
                        ? "bg-gradient-to-br from-accent/20 to-accent-secondary/20 text-accent shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]"
                        : "bg-white/[0.05] text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {product.name}
                  </span>
                </div>
                <span className="text-[11px] font-num text-muted-foreground">
                  {formatNumber(product.sold)} terjual
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-accent-secondary to-accent-tertiary transition-all duration-700 ease-out shadow-[0_0_8px_-2px_rgba(16,185,129,0.3)]"
                  style={{ width: `${product.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
