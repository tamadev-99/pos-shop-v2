"use client";

import { formatRupiah } from "@/lib/utils";
import { type Product } from "@/lib/types";
import { Package } from "lucide-react";

function getTotalStockFromProduct(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Package size={40} className="mb-3 opacity-15" />
        <p className="text-sm">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2.5">
      {products.map((product) => {
        const totalStock = getTotalStockFromProduct(product);
        return (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="group flex flex-col rounded-2xl p-2.5 md:p-3 text-left cursor-pointer
              bg-white/[0.025] backdrop-blur-sm border border-border
              shadow-[0_2px_12px_-4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.03)]
              transition-all duration-300 ease-out
              hover:bg-surface hover:border-accent/20
              hover:shadow-[0_8px_32px_-8px_rgba(16,185,129,0.12),0_0_0_1px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]
              hover:-translate-y-1
              active:scale-[0.97] active:translate-y-0"
          >
            {/* Product Image */}
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] mb-2 md:mb-2.5 flex items-center justify-center overflow-hidden border border-border">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Package
                  size={24}
                  className="text-muted-dim/30 group-hover:text-accent/25 transition-colors duration-300"
                />
              )}
            </div>
            {/* Info */}
            <p className="text-[11px] md:text-xs font-medium text-foreground leading-tight line-clamp-2 mb-0.5">
              {product.name}
            </p>
            <p className="text-[9px] md:text-[10px] text-muted-dim">
              {product.brand}
            </p>
            <p className="text-xs md:text-sm font-bold font-num mt-auto pt-1">
              <span className="text-gradient">{formatRupiah(product.basePrice)}</span>
            </p>
            <p className="text-[10px] text-muted-dim mt-0.5">
              Stok: {totalStock} • {product.variants.length} varian
            </p>
          </button>
        );
      })}
    </div>
  );
}
