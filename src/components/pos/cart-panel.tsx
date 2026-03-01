"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Trash2, X, Pause, Truck } from "lucide-react";

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
}: CartPanelProps) {
  const customerOptions = [
    { label: "Pelanggan Umum", value: "" },
    ...customers.map((c) => ({ label: c.name, value: c.id })),
  ];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax + shippingFee;

  return (
    <div className="flex flex-col h-full border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">Keranjang</h2>
          {items.length > 0 && (
            <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-gradient-to-r from-accent to-accent-secondary px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
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
              className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector */}
      <div className="px-3 py-2 border-b border-white/[0.06] shrink-0">
        <Select
          options={customerOptions}
          value={selectedCustomer}
          onChange={(e) => onCustomerChange(e.target.value)}
          placeholder="Pelanggan Umum"
          className="text-xs"
        />
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
              className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
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
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Minus size={11} />
                </button>
                <span className="w-7 text-center text-xs font-semibold font-num text-foreground">
                  {item.qty}
                </span>
                <button
                  onClick={() => onUpdateQty(item.id, item.qty + 1)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all cursor-pointer backdrop-blur-sm"
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
        <div className="border-t border-white/[0.06] p-4 space-y-3 shrink-0 bg-white/[0.01]">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-num">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PPN (11%)</span>
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
            <div className="h-px bg-white/[0.06] my-1" />
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
