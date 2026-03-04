"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn, formatNumber } from "@/lib/utils";
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  Warehouse,
  Package,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustStock } from "@/lib/actions/products";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantFlat {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  size: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  status: string;
  productId: string;
  productName: string;
  brand: string;
  categoryName: string;
}

export interface StokTabProps {
  initialVariants: VariantFlat[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStockStatus(current: number, min: number) {
  if (current <= 0)
    return { label: "Habis", variant: "destructive" as const };
  if (current <= min)
    return { label: "Stok Rendah", variant: "warning" as const };
  return { label: "Tersedia", variant: "success" as const };
}

const adjustmentTypes = [
  { label: "Stok Masuk", value: "masuk" },
  { label: "Stok Keluar", value: "keluar" },
  { label: "Koreksi", value: "koreksi" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StokTab({ initialVariants }: StokTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Adjustment form state
  const [adjustVariantId, setAdjustVariantId] = useState("");
  const [adjustType, setAdjustType] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  const variantItems = initialVariants;

  const lowStockCount = variantItems.filter(
    (v) => v.stock <= v.minStock
  ).length;

  const filtered = variantItems.filter(
    (v) =>
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function resetAdjustForm() {
    setAdjustVariantId("");
    setAdjustType("");
    setAdjustQty("");
    setAdjustNotes("");
  }

  function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!adjustVariantId || !adjustType || !adjustQty) {
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Jumlah harus lebih dari 0.");
      return;
    }

    // Determine the actual quantity adjustment
    let actualQty = qty;
    if (adjustType === "keluar") {
      actualQty = -qty;
    }
    // For "masuk" and "koreksi", we add the quantity as-is

    const reason = `${adjustmentTypes.find((t) => t.value === adjustType)?.label || adjustType}${adjustNotes ? `: ${adjustNotes}` : ""}`;

    startTransition(async () => {
      try {
        await adjustStock(adjustVariantId, actualQty, reason);
        toast.success("Stok berhasil disesuaikan.");
        resetAdjustForm();
        setAdjustOpen(false);
        router.refresh();
      } catch {
        toast.error("Gagal menyesuaikan stok. Silakan coba lagi.");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex justify-between items-center animate-fade-up">
        <h2 className="text-sm font-semibold text-foreground">Data Stok</h2>
        <Button onClick={() => setAdjustOpen(true)} size="sm">
          <ArrowUpDown size={15} className="mr-1" />
          Penyesuaian Stok
        </Button>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 stagger">
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <Warehouse size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Varian
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(variantItems.length)}
            </p>
          </div>
        </Card>
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Stok Rendah
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-warning">
              {formatNumber(lowStockCount)}
            </p>
          </div>
        </Card>
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <Package size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Stok Tersedia
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-success">
              {formatNumber(variantItems.length - lowStockCount)}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <Input
          placeholder="Cari produk atau SKU..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "260ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  SKU
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Warna
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Ukuran
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Min. Stok
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStockStatus(item.stock, item.minStock);
                const isLow = item.stock <= item.minStock;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border transition-all duration-300",
                      isLow
                        ? "bg-warning/[0.02] hover:bg-warning/[0.04]"
                        : "hover:bg-white/[0.025]"
                    )}
                  >
                    <td className="px-3 md:px-4 py-3 text-xs font-medium text-foreground">
                      {item.productName}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                      {item.sku}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {item.color}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {item.size}
                    </td>
                    <td
                      className={cn(
                        "px-3 md:px-4 py-3 text-xs font-bold font-num",
                        isLow ? "text-warning" : "text-foreground"
                      )}
                    >
                      {formatNumber(item.stock)}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden lg:table-cell">
                      {formatNumber(item.minStock)}
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <Package
                      size={28}
                      className="mx-auto mb-2 opacity-10"
                    />
                    Tidak ada varian produk ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog
        open={adjustOpen}
        onClose={() => {
          setAdjustOpen(false);
          resetAdjustForm();
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setAdjustOpen(false);
            resetAdjustForm();
          }}
        />
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Produk
            </label>
            <Select
              options={variantItems.map((v) => ({
                label: `${v.productName} - ${v.color} - ${v.size} (${v.sku})`,
                value: v.id,
              }))}
              placeholder="Pilih produk"
              value={adjustVariantId}
              onChange={(e) => setAdjustVariantId(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tipe
              </label>
              <Select
                options={adjustmentTypes}
                placeholder="Pilih tipe"
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Jumlah
              </label>
              <Input
                type="number"
                placeholder="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Catatan
            </label>
            <Input
              placeholder="Catatan penyesuaian (opsional)"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdjustOpen(false);
                resetAdjustForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
