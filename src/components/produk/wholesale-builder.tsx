"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export interface WholesaleTier {
  minQty: number;
  price: number;
}

interface WholesaleBuilderProps {
  tiers: WholesaleTier[];
  onChange: (tiers: WholesaleTier[]) => void;
  basePrice?: number;
}

export function WholesaleBuilder({ tiers, onChange, basePrice = 0 }: WholesaleBuilderProps) {
  function handleAdd() {
    const newTier = { minQty: 2, price: basePrice || 0 };
    onChange([...tiers, newTier]);
  }

  function handleRemove(index: number) {
    const newTiers = [...tiers];
    newTiers.splice(index, 1);
    onChange(newTiers);
  }

  function updateTier(index: number, field: keyof WholesaleTier, value: number) {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    // Sort automatically mapping logic could go here, but doing it on change might be jarring for the user typing.
    onChange(newTiers);
  }

  function handleSort() {
    const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
    onChange(sorted);
    toast.success("Diurutkan berdasarkan kuantitas");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Harga Grosir (Wholesale)</p>
          <p className="text-xs text-muted-dim max-w-[280px]">
            Atur diskon harga untuk pembelian dalam jumlah banyak.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tiers.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={handleSort}>
              Urutkan
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
            <Plus size={14} className="mr-1.5" />
            Tambah Tier
          </Button>
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/[0.01] p-6 text-center">
          <Tag size={24} className="mx-auto mb-2 text-muted-dim" />
          <p className="text-xs font-medium text-foreground">Belum ada harga grosir</p>
          <p className="text-[11px] text-muted-dim mt-1">Produk ini hanya akan menggunakan harga dasar.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Minimal Beli (Qty)</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Harga Satuan (Rp)</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-10 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, i) => (
                <tr key={i} className="border-b border-border hover:bg-white/[0.01]">
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={2}
                      value={tier.minQty || ""}
                      onChange={(e) => updateTier(i, "minQty", parseInt(e.target.value) || 0)}
                      className="h-8 font-num w-24"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-dim">Rp</span>
                      <Input
                        type="number"
                        min={0}
                        value={tier.price || ""}
                        onChange={(e) => updateTier(i, "price", parseInt(e.target.value) || 0)}
                        className="h-8 pl-8 font-num w-full"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(i)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
