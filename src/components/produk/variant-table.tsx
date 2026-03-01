"use client";

import type { ProductVariant } from "@/lib/types";
import { formatRupiah, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ─── Color Map ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  Hitam: "#1a1a1a",
  Putih: "#f5f5f5",
  Merah: "#ef4444",
  Navy: "#1e3a5f",
  Cream: "#f5e6d3",
  Maroon: "#800000",
  "Army Green": "#4b5320",
  "Dusty Pink": "#d4a5a5",
  Coklat: "#7b4a2d",
  Khaki: "#c3b090",
  "Abu-Abu": "#9ca3af",
  Gold: "#d4a017",
  Silver: "#c0c0c0",
  "Rose Gold": "#b76e79",
  Sage: "#87ae73",
  Mocca: "#6d4c41",
  Hijau: "#22c55e",
  Tosca: "#14b8a6",
  Ungu: "#a855f7",
  Orange: "#f97316",
  Kuning: "#eab308",
  Biru: "#3b82f6",
  Pink: "#ec4899",
};

function getColorDot(colorName: string): string {
  return COLOR_MAP[colorName] ?? "#6b7280";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLowStock(variant: ProductVariant): boolean {
  return variant.stock <= variant.minStock;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VariantTableProps {
  variants: ProductVariant[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VariantTable({ variants, className }: VariantTableProps) {
  if (variants.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-white/[0.08]",
          "bg-white/[0.01] backdrop-blur-sm",
          "p-8 flex flex-col items-center justify-center gap-2 text-center",
          className
        )}
      >
        <p className="text-xs font-medium text-muted-foreground">
          Tidak ada varian tersedia
        </p>
        <p className="text-[11px] text-muted-dim">
          Produk ini belum memiliki varian yang terdaftar.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] overflow-hidden",
        "bg-white/[0.015] backdrop-blur-sm",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {/* Table header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <p className="text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
          Varian
        </p>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
            "bg-white/[0.05] border border-white/[0.08] text-muted-foreground font-num"
          )}
        >
          {variants.length} varian
        </span>
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {/* Always visible */}
              <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap">
                Warna
              </th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap">
                Ukuran
              </th>
              {/* Hidden on small screens */}
              <th className="hidden sm:table-cell px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap">
                SKU
              </th>
              <th className="hidden md:table-cell px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap">
                Barcode
              </th>
              {/* Always visible */}
              <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap text-right">
                Stok
              </th>
              {/* Hidden on small screens */}
              <th className="hidden sm:table-cell px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap text-right">
                Harga Beli
              </th>
              {/* Always visible */}
              <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap text-right">
                Harga Jual
              </th>
              {/* Always visible */}
              <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const lowStock = isLowStock(variant);
              const dotColor = getColorDot(variant.color);
              const isWhiteish =
                variant.color === "Putih" ||
                variant.color === "Cream" ||
                variant.color === "Silver";

              return (
                <tr
                  key={variant.id}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors duration-150",
                    lowStock
                      ? "bg-warning/[0.04] hover:bg-warning/[0.07]"
                      : "hover:bg-white/[0.02]"
                  )}
                >
                  {/* Warna */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* Color dot */}
                      <span
                        className={cn(
                          "inline-block w-3 h-3 rounded-full flex-shrink-0",
                          "ring-1 ring-offset-1 ring-offset-transparent",
                          isWhiteish
                            ? "ring-white/30"
                            : "ring-white/10"
                        )}
                        style={{ backgroundColor: dotColor }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-foreground whitespace-nowrap">
                        {variant.color}
                      </span>
                    </div>
                  </td>

                  {/* Ukuran */}
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap",
                        "bg-white/[0.05] border border-white/[0.06] text-muted-foreground"
                      )}
                    >
                      {variant.size}
                    </span>
                  </td>

                  {/* SKU — hidden on mobile */}
                  <td className="hidden sm:table-cell px-3 py-2.5">
                    <span className="text-xs font-num text-muted-foreground tracking-wide whitespace-nowrap">
                      {variant.sku}
                    </span>
                  </td>

                  {/* Barcode — hidden on mobile + tablet */}
                  <td className="hidden md:table-cell px-3 py-2.5">
                    <span className="text-xs font-num text-muted-dim tracking-widest whitespace-nowrap">
                      {variant.barcode}
                    </span>
                  </td>

                  {/* Stok */}
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className={cn(
                          "text-xs font-semibold font-num",
                          lowStock ? "text-warning" : "text-foreground"
                        )}
                      >
                        {variant.stock}
                      </span>
                      {lowStock && (
                        <span className="text-[10px] text-warning/70 whitespace-nowrap">
                          min {variant.minStock}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Harga Beli — hidden on mobile */}
                  <td className="hidden sm:table-cell px-3 py-2.5 text-right">
                    <span className="text-xs font-num text-muted-foreground whitespace-nowrap">
                      {formatRupiah(variant.buyPrice)}
                    </span>
                  </td>

                  {/* Harga Jual */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs font-semibold font-num text-foreground whitespace-nowrap">
                      {formatRupiah(variant.sellPrice)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 text-center">
                    {variant.status === "aktif" ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="outline">Nonaktif</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Low stock legend — only render when there are low-stock items */}
      {variants.some(isLowStock) && (
        <div className="px-4 py-2.5 border-t border-white/[0.04] bg-warning/[0.03] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning/60 flex-shrink-0" />
          <p className="text-[11px] text-warning/80">
            Baris dengan latar kuning menandakan stok di bawah atau sama dengan stok minimum.
          </p>
        </div>
      )}
    </div>
  );
}
