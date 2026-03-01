"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import {
  Product,
  ProductVariant,
  getUniqueColors,
  getUniqueSizes,
  getVariantByColorSize,
} from "@/lib/types";
import { cn, formatRupiah } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color map for swatch rendering
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, string> = {
  Hitam: "#1a1a1a",
  Putih: "#f5f5f5",
  Merah: "#ef4444",
  Navy: "#1e3a5f",
  Cream: "#f5e6d3",
  Maroon: "#800000",
  "Army Green": "#4b5320",
  "Dusty Pink": "#d4a0a0",
  Coklat: "#8B4513",
  Khaki: "#c3b091",
  "Abu-Abu": "#808080",
  Gold: "#FFD700",
  Silver: "#C0C0C0",
  "Rose Gold": "#b76e79",
  Sage: "#9CAF88",
  Mocca: "#967969",
  Hijau: "#22c55e",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VariantSelectorProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VariantSelector({
  open,
  onClose,
  product,
  onAddToCart,
}: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Reset selections whenever the product changes or dialog opens
  useEffect(() => {
    setSelectedColor(null);
    setSelectedSize(null);
  }, [product, open]);

  if (!product) return null;

  const colors = getUniqueColors(product);
  const sizes = getUniqueSizes(product);

  // Determine the currently resolved variant (if both color + size chosen)
  const selectedVariant: ProductVariant | undefined =
    selectedColor && selectedSize
      ? getVariantByColorSize(product, selectedColor, selectedSize)
      : undefined;

  // For a given size, check whether it exists for the currently selected color
  const isSizeAvailableForColor = (size: string): boolean => {
    if (!selectedColor) return true;
    return product.variants.some((v) => v.color === selectedColor && v.size === size);
  };

  // For a given color, check whether any stock exists
  const hasAnyStockForColor = (color: string): boolean => {
    return product.variants.some((v) => v.color === color && v.stock > 0);
  };

  const isOutOfStock = selectedVariant !== undefined && selectedVariant.stock === 0;
  const canAddToCart =
    selectedVariant !== undefined &&
    selectedVariant.stock > 0 &&
    selectedVariant.status === "aktif";

  const handleAddToCart = () => {
    if (!canAddToCart || !selectedVariant) return;
    onAddToCart(product, selectedVariant);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogClose onClose={onClose} />

      {/* Header */}
      <DialogHeader>
        <DialogTitle className="pr-8 leading-snug">{product.name}</DialogTitle>
        <p className="text-xs text-muted-foreground mt-0.5 tracking-wide uppercase">
          {product.brand}
        </p>
      </DialogHeader>

      {/* Body */}
      <div className="space-y-5">

        {/* Color selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Warna
            </span>
            {selectedColor && (
              <span className="text-xs text-foreground font-medium">{selectedColor}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((color) => {
              const hex = COLOR_MAP[color] ?? "#888888";
              const isSelected = selectedColor === color;
              const noStock = !hasAnyStockForColor(color);
              const isLight =
                color === "Putih" || color === "Cream" || color === "Gold" || color === "Silver";

              return (
                <button
                  key={color}
                  title={color}
                  onClick={() => {
                    setSelectedColor(color);
                    // If current size is not available for new color, reset it
                    if (
                      selectedSize &&
                      !product.variants.some(
                        (v) => v.color === color && v.size === selectedSize
                      )
                    ) {
                      setSelectedSize(null);
                    }
                  }}
                  className={cn(
                    "relative w-8 h-8 rounded-full transition-all duration-200 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    "hover:scale-110 active:scale-95",
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-[#0f1019] ring-accent scale-110"
                      : [
                        "ring-1",
                        isLight
                          ? "ring-white/30"
                          : "ring-white/10",
                      ].join(" "),
                    noStock && "opacity-35 cursor-not-allowed hover:scale-100"
                  )}
                  style={{ backgroundColor: hex }}
                  disabled={noStock}
                >
                  {/* Out-of-stock diagonal line */}
                  {noStock && (
                    <span
                      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                      aria-hidden
                    >
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block w-px h-full bg-white/60 rotate-45 origin-center" />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ukuran
            </span>
            {selectedSize && (
              <span className="text-xs text-foreground font-medium">{selectedSize}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              const unavailable = !isSizeAvailableForColor(size);

              // Stock check for this specific color+size combo
              const variant = selectedColor
                ? getVariantByColorSize(product, selectedColor, size)
                : undefined;
              const zeroStock = variant !== undefined && variant.stock === 0;

              return (
                <button
                  key={size}
                  onClick={() => !unavailable && setSelectedSize(size)}
                  disabled={unavailable}
                  className={cn(
                    "min-w-[2.75rem] h-9 px-3 rounded-xl text-xs font-semibold",
                    "border transition-all duration-200 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    "active:scale-95",
                    isSelected
                      ? [
                        "bg-gradient-to-r from-accent to-accent-secondary",
                        "text-white border-transparent",
                        "shadow-[0_0_16px_-4px_rgba(16,185,129,0.4)]",
                      ].join(" ")
                      : zeroStock
                        ? [
                          "bg-white/[0.02] text-muted-dim border-white/[0.06]",
                          "line-through opacity-40 cursor-not-allowed",
                        ].join(" ")
                        : [
                          "bg-white/[0.04] text-muted-foreground border-white/[0.08]",
                          "hover:bg-white/[0.08] hover:text-foreground hover:border-white/[0.14]",
                        ].join(" "),
                    unavailable &&
                    "opacity-25 cursor-not-allowed hover:bg-white/[0.04] hover:text-muted-foreground hover:border-white/[0.08]"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Variant info panel */}
        <div
          className={cn(
            "rounded-xl border px-4 py-3 transition-all duration-300",
            selectedVariant
              ? "bg-white/[0.03] border-white/[0.08]"
              : "bg-white/[0.015] border-white/[0.04] opacity-60"
          )}
        >
          {selectedVariant ? (
            <div className="flex items-center justify-between gap-3">
              {/* Price */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Harga</p>
                <p className="text-base font-bold bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
                  {formatRupiah(selectedVariant.sellPrice)}
                </p>
              </div>

              {/* Stock info */}
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground mb-1">Stok</p>
                {isOutOfStock ? (
                  <Badge variant="destructive">Stok Habis</Badge>
                ) : (
                  <div className="flex items-center justify-end gap-1.5">
                    <Package size={12} className="text-muted-foreground" />
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        selectedVariant.stock <= selectedVariant.minStock
                          ? "text-warning"
                          : "text-foreground"
                      )}
                    >
                      {selectedVariant.stock} pcs
                    </span>
                    {selectedVariant.stock <= selectedVariant.minStock && (
                      <Badge variant="warning">Stok Tipis</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-1">
              Pilih warna dan ukuran untuk melihat detail
            </p>
          )}
        </div>

        {/* Add to cart button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
          {isOutOfStock
            ? "Stok Habis"
            : !selectedVariant
              ? "Pilih Varian Terlebih Dahulu"
              : "Tambah ke Keranjang"}
        </Button>
      </div>
    </Dialog>
  );
}
