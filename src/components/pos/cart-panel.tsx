"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Trash2, X, Pause, Truck, Tag, Star, Coins } from "lucide-react";
import type { Promotion } from "@/app/(dashboard)/pos/pos-client";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  qty: number;
}

interface CartPanelProps {
  items: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onClose?: () => void;
  shippingFee: number;
  onShippingFeeChange: (fee: number) => void;
  selectedCustomer: string;
  onCustomerChange: (customerId: string) => void;
  onHold?: () => void;
  heldCount?: number;
  customers?: { id: string; name: string }[];
  // Promotions & discounts
  promotions?: Promotion[];
  selectedPromo?: Promotion | null;
  onPromoChange?: (promo: Promotion | null) => void;
  customerTier?: string;
  tierDiscountPct?: number;
  customerPoints?: number;
  pointsToRedeem?: number;
  onPointsRedeemChange?: (points: number) => void;
  discountAmount?: number;
  taxRate?: number;
}

export function CartPanel({
  items,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
  onClose,
  shippingFee,
  onShippingFeeChange,
  selectedCustomer,
  onCustomerChange,
  onHold,
  heldCount = 0,
  customers = [],
  promotions = [],
  selectedPromo,
  onPromoChange,
  customerTier,
  tierDiscountPct = 0,
  customerPoints = 0,
  pointsToRedeem = 0,
  onPointsRedeemChange,
  discountAmount = 0,
  taxRate,
}: CartPanelProps) {
  const customerOptions = [
    { label: "Pelanggan Umum", value: "" },
    ...customers.map((c) => ({ label: c.name, value: c.id })),
  ];

  const promoOptions = [
    { label: "Tidak ada promo", value: "" },
    ...promotions.map((p) => ({
      label: `${p.name} (${p.type === "percentage" ? `${p.value}%` : p.type === "fixed" ? formatRupiah(p.value) : p.type === "buy_x_get_y" ? `Beli ${p.buyQty} Gratis ${p.getQty}` : formatRupiah(p.value)})`,
      value: p.id,
    })),
  ];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxRateVal = taxRate ?? 11;
  const tax = Math.round((subtotal - Math.max(0, discountAmount - (pointsToRedeem || 0))) * (taxRateVal / 100));
  const total = Math.max(0, subtotal - discountAmount + tax + shippingFee);

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">Keranjang</h2>
          {items.length > 0 && (
            <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-gradient-to-r from-accent to-accent-hover px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
              {items.reduce((sum, i) => sum + i.qty, 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] text-muted-dim hover:text-destructive transition-colors cursor-pointer"
            >
              Hapus semua
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="px-3 py-2 border-b border-border shrink-0 space-y-1.5">
        <Select
          options={customerOptions}
          value={selectedCustomer}
          onChange={(e) => onCustomerChange(e.target.value)}
          placeholder="Pelanggan Umum"
          className="text-xs"
        />
        {/* Show tier badge when customer selected */}
        {selectedCustomer && customerTier && tierDiscountPct > 0 && (
          <div className="flex items-center gap-1.5 px-1">
            <Star size={10} className="text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">
              Member {customerTier} — Diskon {tierDiscountPct}%
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart size={32} className="mb-2 opacity-10" />
            <p className="text-xs text-muted-dim">Keranjang kosong</p>
            <p className="text-[10px] mt-0.5 text-muted-dim/60">
              Pilih produk untuk memulai
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-xl bg-surface border border-border p-2.5 transition-all duration-300 hover:bg-surface hover:border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-muted-dim">
                  {item.color} • {item.size}
                </p>
                <p className="text-[11px] font-num font-semibold text-accent">
                  {formatRupiah(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    item.qty <= 1
                      ? onRemove(item.id)
                      : onUpdateQty(item.id, item.qty - 1)
                  }
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Minus size={11} />
                </button>
                <span className="w-7 text-center text-xs font-semibold font-num text-foreground">
                  {item.qty}
                </span>
                <button
                  onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Plus size={11} />
                </button>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="text-muted-dim hover:text-destructive transition-colors cursor-pointer p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="border-t border-border p-4 space-y-3 shrink-0 bg-white/[0.01]">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-num">{formatRupiah(subtotal)}</span>
            </div>

            {/* Promo selector */}
            {promotions.length > 0 && onPromoChange && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag size={12} className="text-violet-400 shrink-0" />
                <Select
                  options={promoOptions}
                  value={selectedPromo?.id || ""}
                  onChange={(e) => {
                    const promo = promotions.find((p) => p.id === e.target.value) || null;
                    onPromoChange(promo);
                  }}
                  placeholder="Pilih promo"
                  className="text-[11px] flex-1"
                />
              </div>
            )}

            {/* Points redemption */}
            {selectedCustomer && customerPoints > 0 && onPointsRedeemChange && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins size={12} className="text-amber-400 shrink-0" />
                <span className="text-[11px] shrink-0">Poin ({customerPoints})</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={pointsToRedeem || ""}
                  onChange={(e) => onPointsRedeemChange(Math.min(parseInt(e.target.value) || 0, customerPoints, subtotal))}
                  className="w-20 text-right text-[11px] h-6 font-num"
                  min={0}
                  max={Math.min(customerPoints, subtotal)}
                />
              </div>
            )}

            {/* Discount row */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-400">
                <span>Diskon</span>
                <span className="font-num">-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PPN ({taxRateVal}%)</span>
              <span className="font-num">{formatRupiah(tax)}</span>
            </div>
            {/* Ongkir */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck size={12} />
                Ongkir
              </span>
              <Input
                type="number"
                placeholder="0"
                value={shippingFee || ""}
                onChange={(e) => onShippingFeeChange(parseInt(e.target.value) || 0)}
                className="w-24 text-right text-xs h-7 font-num"
              />
            </div>
            <div className="h-px bg-surface my-1" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span className="font-num text-gradient">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {onHold && (
              <Button
                onClick={onHold}
                variant="secondary"
                className="h-11 text-xs font-semibold relative"
              >
                <Pause size={14} />
                Tahan
                {heldCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4 h-4 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {heldCount}
                  </span>
                )}
              </Button>
            )}
            <Button
              onClick={onCheckout}
              className="flex-1 h-11 text-sm font-bold"
            >
              Bayar — {formatRupiah(total)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
