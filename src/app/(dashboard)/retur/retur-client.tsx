"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import {
  Search,
  Eye,
  Plus,
  RotateCcw,
  Banknote,
  TrendingDown,
  FileText,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReturStatus = "menunggu" | "disetujui" | "ditolak" | "selesai";

type ReturReason =
  | "Ukuran Tidak Cocok"
  | "Warna Berbeda"
  | "Cacat Produk"
  | "Berubah Pikiran";

type RefundMethod = "Tunai" | "E-Wallet" | "Store Credit" | "Tukar Ukuran";

interface ReturItem {
  product: string;
  qty: number;
  price: number;
}

interface Retur {
  id: string;
  orderId: string;
  date: string;
  customer: string;
  items: ReturItem[];
  refundAmount: number;
  status: ReturStatus;
  reason: ReturReason;
  refundMethod: RefundMethod;
  adminNotes: string;
}

interface CreateReturProduct {
  name: string;
  qty: string;
  selected: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusVariant: Record<ReturStatus, BadgeVariant> = {
  menunggu: "warning",
  disetujui: "default",
  ditolak: "destructive",
  selesai: "success",
};

const statusLabel: Record<ReturStatus, string> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Selesai",
};

const tabOptions = [
  { label: "Semua", value: "all" },
  { label: "Menunggu", value: "menunggu" },
  { label: "Disetujui", value: "disetujui" },
  { label: "Ditolak", value: "ditolak" },
  { label: "Selesai", value: "selesai" },
];

const reasonOptions = [
  { label: "Ukuran Tidak Cocok", value: "Ukuran Tidak Cocok" },
  { label: "Warna Berbeda", value: "Warna Berbeda" },
  { label: "Cacat Produk", value: "Cacat Produk" },
  { label: "Berubah Pikiran", value: "Berubah Pikiran" },
];

const refundMethodOptions = [
  { label: "Tunai", value: "Tunai" },
  { label: "E-Wallet", value: "E-Wallet" },
  { label: "Store Credit", value: "Store Credit" },
  { label: "Tukar Ukuran", value: "Tukar Ukuran" },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------


// Simulated products for create dialog
const orderProducts: CreateReturProduct[] = [
  { name: "Kaos Polos Basic (Hitam, M)", qty: "1", selected: false },
  { name: "Hijab Segi Empat (Pink)", qty: "1", selected: false },
  { name: "Kemeja Flannel (Navy, L)", qty: "1", selected: false },
];

export interface ReturClientProps {
  initialReturns: Retur[];
}

export default function ReturClient({ initialReturns }: ReturClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRetur, setSelectedRetur] = useState<Retur | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [createOrderId, setCreateOrderId] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [createRefundMethod, setCreateRefundMethod] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createProducts, setCreateProducts] =
    useState<CreateReturProduct[]>(orderProducts);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const totalReturBulanIni = initialReturns.filter((r) =>
    r.date.includes("2026-02") || r.date.includes(new Date().getFullYear().toString())
  ).length;

  const totalRefund = initialReturns
    .filter((r) => r.status === "selesai" || r.status === "disetujui")
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const totalOrders = 850; // simulated total orders this month
  const tingkatRetur = ((totalReturBulanIni / totalOrders) * 100).toFixed(1);

  const filtered = initialReturns.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      r.id.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // ---------------------------------------------------------------------------
  // Create Form Helpers
  // ---------------------------------------------------------------------------

  function toggleProduct(index: number) {
    setCreateProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, selected: !p.selected } : p
      )
    );
  }

  function updateProductQty(index: number, qty: string) {
    setCreateProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, qty } : p))
    );
  }

  function resetCreateForm() {
    setCreateOrderId("");
    setCreateReason("");
    setCreateRefundMethod("");
    setCreateNotes("");
    setCreateProducts(
      orderProducts.map((p) => ({ ...p, selected: false }))
    );
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In a real app this would POST to an API
    resetCreateForm();
    setCreateOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Retur &amp; Refund
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola pengembalian barang dan proses refund pelanggan
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Buat Retur
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "60ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(244,63,94,0.25)]">
            <RotateCcw size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Retur Bulan Ini
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {totalReturBulanIni}
            </p>
          </div>
        </Card>
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="warning"
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <Banknote size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Refund
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-warning">
              {formatRupiah(totalRefund)}
            </p>
          </div>
        </Card>
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "180ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]">
            <TrendingDown size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Tingkat Retur
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {tingkatRetur}%
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <Tabs tabs={tabOptions} value={activeTab} onChange={setActiveTab} />
        <Input
          placeholder="Cari Retur ID atau Order ID..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[240px]"
        />
      </div>

      {/* Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Retur ID
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Order ID
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Tanggal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Pelanggan
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Produk
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Refund
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((retur) => (
                <tr
                  key={retur.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                    {retur.id}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">
                    {retur.orderId}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                    {retur.date}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-foreground hidden lg:table-cell">
                    {retur.customer}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {retur.items.length} item
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                    {formatRupiah(retur.refundAmount)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge variant={statusVariant[retur.status]}>
                      {statusLabel[retur.status]}
                    </Badge>
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRetur(retur)}
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <FileText size={28} className="mx-auto mb-2 opacity-10" />
                    Tidak ada data retur ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================================================================= */}
      {/* Detail Dialog                                                      */}
      {/* ================================================================= */}
      <Dialog
        open={!!selectedRetur}
        onClose={() => setSelectedRetur(null)}
        className="max-w-lg"
      >
        {selectedRetur && (
          <>
            <DialogClose onClose={() => setSelectedRetur(null)} />
            <DialogHeader>
              <DialogTitle>Detail Retur {selectedRetur.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                    Order ID
                  </p>
                  <p className="text-xs font-medium text-foreground font-num mt-0.5">
                    {selectedRetur.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                    Pelanggan
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {selectedRetur.customer}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                    Tanggal
                  </p>
                  <p className="text-xs font-medium text-foreground font-num mt-0.5">
                    {selectedRetur.date}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                    Status
                  </p>
                  <div className="mt-0.5">
                    <Badge variant={statusVariant[selectedRetur.status]}>
                      {statusLabel[selectedRetur.status]}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                    Alasan Retur
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {selectedRetur.reason}
                  </p>
                </div>
              </div>

              {/* Returned items table */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase">
                        Produk
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-center">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-right">
                        Harga
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRetur.items.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-xs text-foreground">
                          {item.product}
                        </td>
                        <td className="px-3 py-2 text-xs text-center font-num text-muted-foreground">
                          {item.qty}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-num text-muted-foreground">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-num text-foreground">
                          {formatRupiah(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Refund total */}
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <span className="text-sm font-semibold text-foreground">
                  Total Refund
                </span>
                <span className="text-sm font-bold font-num text-gradient">
                  {formatRupiah(selectedRetur.refundAmount)}
                </span>
              </div>

              {/* Refund method */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-1">
                  Metode Refund
                </p>
                <p className="text-xs font-medium text-foreground">
                  {selectedRetur.refundMethod}
                </p>
              </div>

              {/* Admin notes */}
              {selectedRetur.adminNotes && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-1">
                    Catatan Admin
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedRetur.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </Dialog>

      {/* ================================================================= */}
      {/* Create Return Dialog                                               */}
      {/* ================================================================= */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
        />
        <DialogHeader>
          <DialogTitle>Buat Retur Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Order ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Order ID
            </label>
            <Input
              placeholder="Contoh: ORD-001"
              value={createOrderId}
              onChange={(e) => setCreateOrderId(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Alasan Retur
            </label>
            <Select
              options={reasonOptions}
              placeholder="Pilih alasan retur"
              value={createReason}
              onChange={(e) => setCreateReason(e.target.value)}
            />
          </div>

          {/* Product checkboxes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Produk yang Diretur
            </label>
            <div className="space-y-2">
              {createProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleProduct(index)}
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all duration-200 ${product.selected
                        ? "bg-accent border-accent text-white"
                        : "border-white/[0.15] bg-white/[0.04]"
                      }`}
                  >
                    {product.selected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{product.name}</p>
                  </div>
                  <div className="w-16">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={product.qty}
                      onChange={(e) =>
                        updateProductQty(index, e.target.value)
                      }
                      className="text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund method */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Metode Refund
            </label>
            <Select
              options={refundMethodOptions}
              placeholder="Pilih metode refund"
              value={createRefundMethod}
              onChange={(e) => setCreateRefundMethod(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Catatan
            </label>
            <Input
              placeholder="Catatan tambahan (opsional)"
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              <Plus size={15} />
              Buat Retur
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
