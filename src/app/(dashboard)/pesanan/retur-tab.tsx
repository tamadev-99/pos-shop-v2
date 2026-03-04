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
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createReturn, processReturn } from "@/lib/actions/returns";
import { getOrderById } from "@/lib/actions/orders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReturStatus = "diproses" | "disetujui" | "ditolak" | "selesai";

type RefundMethod = "tunai" | "transfer" | "poin";

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
  reason: string;
  refundMethod: string;
  adminNotes: string;
}

interface OrderItemForReturn {
  variantId: string;
  productName: string;
  variantInfo: string;
  qty: number;
  maxQty: number;
  unitPrice: number;
  selected: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusVariant: Record<ReturStatus, BadgeVariant> = {
  diproses: "warning",
  disetujui: "default",
  ditolak: "destructive",
  selesai: "success",
};

const statusLabel: Record<ReturStatus, string> = {
  diproses: "Diproses",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Selesai",
};

const tabOptions = [
  { label: "Semua", value: "all" },
  { label: "Diproses", value: "diproses" },
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
  { label: "Tunai", value: "tunai" },
  { label: "Transfer Bank", value: "transfer" },
  { label: "Poin", value: "poin" },
];

const refundMethodLabel: Record<string, string> = {
  tunai: "Tunai",
  transfer: "Transfer Bank",
  poin: "Poin",
};

export interface ReturTabProps {
  initialReturns: Retur[];
  totalOrders: number;
}

export function ReturTab({ initialReturns, totalOrders }: ReturTabProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRetur, setSelectedRetur] = useState<Retur | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Create form state
  const [createOrderId, setCreateOrderId] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [createRefundMethod, setCreateRefundMethod] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemForReturn[]>([]);
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);
  const [orderFound, setOrderFound] = useState<boolean | null>(null);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalReturBulanIni = initialReturns.filter((r) =>
    r.date.includes(currentYearMonth)
  ).length;

  const totalRefund = initialReturns
    .filter((r) => r.status === "selesai" || r.status === "disetujui")
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const tingkatRetur = totalOrders > 0 ? ((totalReturBulanIni / totalOrders) * 100).toFixed(1) : "0.0";

  const filtered = initialReturns.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      r.id.toLowerCase().includes(q) ||
      r.orderId.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // ---------------------------------------------------------------------------
  // Order Lookup
  // ---------------------------------------------------------------------------

  async function lookupOrder() {
    if (!createOrderId.trim()) {
      toast.error("Masukkan Order ID");
      return;
    }
    setOrderLookupLoading(true);
    setOrderFound(null);
    try {
      const order = await getOrderById(createOrderId.trim());
      if (order && order.items.length > 0) {
        setOrderFound(true);
        setOrderItems(
          order.items.map((item) => ({
            variantId: item.variantId || "",
            productName: item.productName,
            variantInfo: item.variantInfo,
            qty: 1,
            maxQty: item.qty,
            unitPrice: item.unitPrice,
            selected: false,
          }))
        );
      } else {
        setOrderFound(false);
        setOrderItems([]);
        toast.error("Order tidak ditemukan atau tidak memiliki item");
      }
    } catch {
      setOrderFound(false);
      toast.error("Gagal memuat data order");
    } finally {
      setOrderLookupLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Create Form Helpers
  // ---------------------------------------------------------------------------

  function toggleProduct(index: number) {
    setOrderItems((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, selected: !p.selected } : p
      )
    );
  }

  function updateProductQty(index: number, qty: number) {
    setOrderItems((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, qty: Math.min(Math.max(1, qty), p.maxQty) } : p
      )
    );
  }

  function resetCreateForm() {
    setCreateOrderId("");
    setCreateReason("");
    setCreateRefundMethod("");
    setCreateNotes("");
    setOrderItems([]);
    setOrderFound(null);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedItems = orderItems.filter((i) => i.selected && i.variantId);
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal satu produk untuk diretur");
      return;
    }
    if (!createReason) {
      toast.error("Alasan retur wajib diisi");
      return;
    }
    setProcessing(true);
    try {
      await createReturn({
        orderId: createOrderId.trim(),
        reason: createReason,
        refundMethod: (createRefundMethod as RefundMethod) || undefined,
        items: selectedItems.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          variantInfo: i.variantInfo,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
      });
      toast.success("Retur berhasil dibuat");
      resetCreateForm();
      setCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("Gagal membuat retur");
    } finally {
      setProcessing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Process Return (Approve / Reject)
  // ---------------------------------------------------------------------------

  async function handleProcessReturn(id: string, decision: "disetujui" | "ditolak") {
    setProcessing(true);
    try {
      await processReturn(id, decision);
      toast.success(decision === "disetujui" ? "Retur disetujui, stok dikembalikan" : "Retur ditolak");
      setSelectedRetur(null);
      router.refresh();
    } catch {
      toast.error("Gagal memproses retur");
    } finally {
      setProcessing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-up">
        <h2 className="text-sm font-semibold text-foreground">Data Retur &amp; Refund</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus size={15} className="mr-1" />
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
              <tr className="border-b border-border bg-surface">
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
                  className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
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
              <div className="rounded-xl border border-border overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface">
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
                      <tr key={i} className="border-t border-border">
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
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-semibold text-foreground">
                  Total Refund
                </span>
                <span className="text-sm font-bold font-num text-gradient">
                  {formatRupiah(selectedRetur.refundAmount)}
                </span>
              </div>

              {/* Refund method */}
              <div className="rounded-xl bg-surface border border-border p-3">
                <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-1">
                  Metode Refund
                </p>
                <p className="text-xs font-medium text-foreground">
                  {refundMethodLabel[selectedRetur.refundMethod] || selectedRetur.refundMethod}
                </p>
              </div>

              {/* Admin notes */}
              {selectedRetur.adminNotes && (
                <div className="rounded-xl bg-surface border border-border p-3">
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-1">
                    Catatan Admin
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedRetur.adminNotes}
                  </p>
                </div>
              )}

              {/* Approve / Reject buttons */}
              {selectedRetur.status === "diproses" && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={processing}
                    onClick={() => handleProcessReturn(selectedRetur.id, "ditolak")}
                  >
                    <XCircle size={14} />
                    Tolak
                  </Button>
                  <Button
                    size="sm"
                    disabled={processing}
                    onClick={() => handleProcessReturn(selectedRetur.id, "disetujui")}
                  >
                    <CheckCircle size={14} />
                    Setujui
                  </Button>
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
          {/* Order ID with lookup */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Order ID
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: ORD-260301-ABCD"
                value={createOrderId}
                onChange={(e) => {
                  setCreateOrderId(e.target.value);
                  setOrderFound(null);
                  setOrderItems([]);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={lookupOrder}
                disabled={orderLookupLoading}
              >
                {orderLookupLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                Cari
              </Button>
            </div>
            {orderFound === false && (
              <p className="text-[11px] text-destructive">Order tidak ditemukan</p>
            )}
            {orderFound === true && (
              <p className="text-[11px] text-accent">Order ditemukan — {orderItems.length} item</p>
            )}
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

          {/* Product checkboxes from order lookup */}
          {orderItems.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Produk yang Diretur
              </label>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl bg-surface border border-border p-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleProduct(index)}
                      className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all duration-200 ${item.selected
                          ? "bg-accent border-accent text-white"
                          : "border-white/[0.15] bg-card"
                        }`}
                    >
                      {item.selected && (
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
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {item.productName}
                      </p>
                      {item.variantInfo && (
                        <p className="text-[10px] text-muted-foreground">{item.variantInfo}</p>
                      )}
                      <p className="text-[10px] text-muted-dim font-num">
                        {formatRupiah(item.unitPrice)} &middot; max {item.maxQty}
                      </p>
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={String(item.qty)}
                        onChange={(e) =>
                          updateProductQty(index, parseInt(e.target.value) || 1)
                        }
                        min={1}
                        max={item.maxQty}
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <Button type="submit" disabled={processing || orderItems.filter(i => i.selected).length === 0}>
              {processing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Buat Retur
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
