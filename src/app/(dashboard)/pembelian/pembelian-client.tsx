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
import { formatRupiah, formatNumber } from "@/lib/utils";
import {
  Search,
  Eye,
  Plus,
  Trash2,
  ShoppingCart,
  Clock,
  Banknote,
  FileText,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPurchaseOrder,
  updatePOStatus,
} from "@/lib/actions/purchases";
import { SupplierTab } from "./supplier-tab";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type POStatus = "diproses" | "dikirim" | "diterima" | "dibatalkan";

interface POTimelineEntry {
  id: string;
  purchaseOrderId: string;
  status: string;
  note: string | null;
  date: string;
  createdAt: Date;
}

interface POItem {
  id: string;
  purchaseOrderId: string;
  variantId: string | null;
  productName: string;
  variantInfo: string;
  qty: number;
  unitCost: number;
  subtotal: number;
}

interface POSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  totalOrders: number;
  totalSpent: number;
  status: string;
  joinDate: string;
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string;
  expectedDate: string | null;
  receivedDate: string | null;
  status: POStatus;
  total: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  supplier: POSupplier;
  items: POItem[];
  timeline: POTimelineEntry[];
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  totalOrders: number;
  totalSpent: number;
  status: "aktif" | "nonaktif";
  joinDate: string;
  createdAt: Date;
  categories: string[];
}

interface Variant {
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
  brand: string | null;
  categoryName: string;
  supplierId: string | null;
}

interface CreatePOItem {
  variantId: string;
  productName: string;
  variantInfo: string;
  qty: string;
  buyPrice: string;
}

interface Props {
  initialPOs: PurchaseOrder[];
  suppliers: Supplier[];
  products: Variant[];
  categories?: { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusVariant: Record<POStatus, BadgeVariant> = {
  diproses: "warning",
  dikirim: "default",
  diterima: "success",
  dibatalkan: "destructive",
};

const statusLabel: Record<POStatus, string> = {
  diproses: "Diproses",
  dikirim: "Dikirim",
  diterima: "Diterima",
  dibatalkan: "Dibatalkan",
};

const tabOptions = [
  { label: "Semua", value: "all" },
  { label: "Diproses", value: "diproses" },
  { label: "Dikirim", value: "dikirim" },
  { label: "Diterima", value: "diterima" },
  { label: "Dibatalkan", value: "dibatalkan" },
];

const mainTabOptions = [
  { label: "Riwayat PO", value: "pembelian" },
  { label: "Data Pemasok", value: "supplier" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const timelineIcons: Record<string, React.ReactNode> = {
  Dibuat: <FileText size={14} />,
  "PO Dibuat": <FileText size={14} />,
  "Dikonfirmasi Supplier": <CheckCircle2 size={14} />,
  Dikirim: <Truck size={14} />,
  Diterima: <PackageCheck size={14} />,
  Dibatalkan: <XCircle size={14} />,
  Diproses: <Clock size={14} />,
};

const emptyCreateItem = (): CreatePOItem => ({
  variantId: "",
  productName: "",
  variantInfo: "",
  qty: "",
  buyPrice: "",
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PembelianClient({ initialPOs, suppliers, products, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mainTab, setMainTab] = useState("pembelian");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create PO form state
  const [createSupplier, setCreateSupplier] = useState("");
  const [createItems, setCreateItems] = useState<CreatePOItem[]>([
    emptyCreateItem(),
  ]);
  const [createNotes, setCreateNotes] = useState("");

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const selectedSupplierObj = createSupplier
    ? suppliers.find((s) => s.id === createSupplier)
    : null;

  // Show all variants but prioritize those matching the selected supplier
  const availableVariants = [...products].sort((a, b) => {
    const aMatch = createSupplier && a.supplierId === createSupplier;
    const bMatch = createSupplier && b.supplierId === createSupplier;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return a.productName.localeCompare(b.productName);
  });

  const productOptions = availableVariants.map((v) => {
    const isSupplierMatch = createSupplier && v.supplierId === createSupplier;
    return {
      label: `${isSupplierMatch ? "★ " : ""}${v.productName} (${v.color}, ${v.size}) - ${formatRupiah(v.buyPrice)}`,
      value: v.id,
    };
  });

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const purchaseOrders = initialPOs;

  const totalPO = purchaseOrders.length;
  const pendingPO = purchaseOrders.filter(
    (po) => po.status === "diproses"
  ).length;

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalBelanja = purchaseOrders
    .filter(
      (po) =>
        po.status !== "dibatalkan" &&
        po.date.startsWith(currentYearMonth)
    )
    .reduce((sum, po) => sum + po.total, 0);

  const filtered = purchaseOrders.filter((po) => {
    const matchTab = activeTab === "all" || po.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      po.id.toLowerCase().includes(q) ||
      po.supplier.name.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // ---------------------------------------------------------------------------
  // Create PO Helpers
  // ---------------------------------------------------------------------------

  function addCreateItem() {
    setCreateItems((prev) => [...prev, emptyCreateItem()]);
  }

  function removeCreateItem(index: number) {
    setCreateItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCreateItem(
    index: number,
    field: keyof CreatePOItem,
    value: string
  ) {
    if (field === "variantId") {
      const variant = products.find((p) => p.id === value);
      if (variant) {
        setCreateItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                ...item,
                variantId: value,
                productName: variant.productName,
                variantInfo: `${variant.color}, ${variant.size}`,
                buyPrice: variant.buyPrice.toString(),
              }
              : item
          )
        );
        return;
      }
    }

    setCreateItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function resetCreateForm() {
    setCreateSupplier("");
    setCreateItems([emptyCreateItem()]);
    setCreateNotes("");
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!createSupplier) {
      toast.error("Pilih supplier terlebih dahulu.");
      return;
    }

    const validItems = createItems.filter(
      (item) =>
        item.variantId !== "" &&
        parseInt(item.qty) > 0 &&
        parseInt(item.buyPrice) >= 0
    );

    if (validItems.length === 0) {
      toast.error("Tambahkan minimal satu item produk yang valid.");
      return;
    }

    startTransition(async () => {
      try {
        await createPurchaseOrder({
          supplierId: createSupplier,
          items: validItems.map((item) => ({
            variantId: item.variantId,
            productName: item.productName,
            variantInfo: item.variantInfo,
            qty: parseInt(item.qty),
            unitCost: parseInt(item.buyPrice),
          })),
          notes: createNotes || undefined,
        });
        toast.success("Pesanan pembelian berhasil dibuat.");
        resetCreateForm();
        setCreateOpen(false);
        router.refresh();
      } catch {
        toast.error("Gagal membuat pesanan pembelian. Silakan coba lagi.");
      }
    });
  }

  const createTotal = createItems.reduce((sum, item) => {
    const qty = parseInt(item.qty) || 0;
    const price = parseInt(item.buyPrice) || 0;
    return sum + qty * price;
  }, 0);

  // ---------------------------------------------------------------------------
  // Status update handler
  // ---------------------------------------------------------------------------

  function handleStatusUpdate(
    poId: string,
    newStatus: "diproses" | "dikirim" | "diterima" | "dibatalkan"
  ) {
    startTransition(async () => {
      try {
        await updatePOStatus(poId, newStatus);
        toast.success(`Status PO berhasil diubah ke "${statusLabel[newStatus]}".`);
        setSelectedPO(null);
        router.refresh();
      } catch {
        toast.error("Gagal mengubah status PO. Silakan coba lagi.");
      }
    });
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
            Pembelian &amp; Pemasok
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola stok dari pemasok serta daftar kontak supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mainTab === "pembelian" && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={15} />
              Buat Pesanan
            </Button>
          )}
        </div>
      </div>

      <div className="animate-fade-up">
        <Tabs tabs={mainTabOptions} value={mainTab} onChange={setMainTab} className="w-fit" />
      </div>

      {mainTab === "pembelian" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 stagger">
            <Card
              className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
              hover
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
                <ShoppingCart size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                  Total PO
                </p>
                <p className="text-lg md:text-xl font-bold font-num text-foreground">
                  {formatNumber(totalPO)}
                </p>
              </div>
            </Card>
            <Card
              className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
              hover
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
                <Clock size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                  Pending PO
                </p>
                <p className="text-lg md:text-xl font-bold font-num text-warning">
                  {formatNumber(pendingPO)}
                </p>
              </div>
            </Card>
            <Card
              className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
              hover
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
                <Banknote size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                  Total Belanja Bulan Ini
                </p>
                <p className="text-lg md:text-xl font-bold font-num text-foreground">
                  {formatRupiah(totalBelanja)}
                </p>
              </div>
            </Card>
          </div>

          {/* Tabs + Search */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <Tabs tabs={tabOptions} value={activeTab} onChange={setActiveTab} />
            <Input
              placeholder="Cari PO ID atau supplier..."
              icon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-[240px]"
            />
          </div>

          {/* Table */}
          <Card
            className="overflow-hidden animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      PO ID
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                      Tanggal
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                      Supplier
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                      Jumlah Item
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Total
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
                  {filtered.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
                    >
                      <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                        {po.id}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                        {po.date}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-foreground hidden sm:table-cell">
                        {po.supplier.name}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden lg:table-cell">
                        {po.items.length} produk
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                        {formatRupiah(po.total)}
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <Badge variant={statusVariant[po.status]}>
                          {statusLabel[po.status]}
                        </Badge>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPO(po)}
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        <FileText
                          size={28}
                          className="mx-auto mb-2 opacity-10"
                        />
                        Tidak ada pesanan pembelian ditemukan
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
            open={!!selectedPO}
            onClose={() => setSelectedPO(null)}
            className="max-w-lg"
          >
            {selectedPO && (
              <>
                <DialogClose onClose={() => setSelectedPO(null)} />
                <DialogHeader>
                  <DialogTitle>Detail {selectedPO.id}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                        Supplier
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedPO.supplier.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                        Tanggal
                      </p>
                      <p className="text-xs font-medium text-foreground font-num mt-0.5">
                        {selectedPO.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                        Status
                      </p>
                      <div className="mt-0.5">
                        <Badge variant={statusVariant[selectedPO.status]}>
                          {statusLabel[selectedPO.status]}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-dim uppercase tracking-wider">
                        Total
                      </p>
                      <p className="text-xs font-bold text-gradient font-num mt-0.5">
                        {formatRupiah(selectedPO.total)}
                      </p>
                    </div>
                  </div>

                  {/* Item list */}
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
                            Harga Beli
                          </th>
                          <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-right">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPO.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-t border-border"
                          >
                            <td className="px-3 py-2 text-xs text-foreground">
                              {item.productName}
                              {item.variantInfo ? ` (${item.variantInfo})` : ""}
                            </td>
                            <td className="px-3 py-2 text-xs text-center font-num text-muted-foreground">
                              {formatNumber(item.qty)}
                            </td>
                            <td className="px-3 py-2 text-xs text-right font-num text-muted-foreground">
                              {formatRupiah(item.unitCost)}
                            </td>
                            <td className="px-3 py-2 text-xs text-right font-num text-foreground">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-2">
                      Status Timeline
                    </p>
                    <div className="space-y-0">
                      {selectedPO.timeline.map((step, i) => {
                        const isLast =
                          i === selectedPO.timeline.length - 1;
                        return (
                          <div key={step.id} className="flex gap-3">
                            {/* Vertical line + dot */}
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-accent/15 text-accent">
                                {timelineIcons[step.status] || (
                                  <CheckCircle2 size={14} />
                                )}
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 min-h-[16px] bg-accent/20" />
                              )}
                            </div>
                            {/* Content */}
                            <div className="pb-3">
                              <p className="text-xs font-medium text-foreground">
                                {step.status}
                              </p>
                              <p className="text-[10px] text-muted-dim font-num">
                                {step.date}
                              </p>
                              {step.note && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {step.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPO.notes && (
                    <div className="rounded-xl bg-surface border border-border p-3">
                      <p className="text-[11px] text-muted-dim uppercase tracking-wider mb-1">
                        Catatan
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedPO.notes}
                      </p>
                    </div>
                  )}

                  {/* Status action buttons */}
                  {selectedPO.status !== "diterima" &&
                    selectedPO.status !== "dibatalkan" && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {selectedPO.status === "diproses" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(selectedPO.id, "dikirim")
                              }
                              disabled={isPending}
                            >
                              <Truck size={14} />
                              Tandai Dikirim
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleStatusUpdate(
                                  selectedPO.id,
                                  "dibatalkan"
                                )
                              }
                              disabled={isPending}
                            >
                              <XCircle size={14} />
                              Batalkan
                            </Button>
                          </>
                        )}
                        {selectedPO.status === "dikirim" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(selectedPO.id, "diterima")
                            }
                            disabled={isPending}
                          >
                            <PackageCheck size={14} />
                            Tandai Diterima
                          </Button>
                        )}
                      </div>
                    )}
                </div>
              </>
            )}
          </Dialog>

          {/* ================================================================= */}
          {/* Create PO Dialog                                                   */}
          {/* ================================================================= */}
          <Dialog
            open={createOpen}
            onClose={() => {
              setCreateOpen(false);
              resetCreateForm();
            }}
            className="max-w-xl"
          >
            <DialogClose
              onClose={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            />
            <DialogHeader>
              <DialogTitle>Buat Pesanan Pembelian</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Supplier
                </label>
                <Select
                  options={supplierOptions}
                  placeholder="Pilih supplier"
                  value={createSupplier}
                  onChange={(e) => setCreateSupplier(e.target.value)}
                />
              </div>

              {/* Item rows */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Daftar Produk
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addCreateItem}
                  >
                    <Plus size={14} />
                    Tambah Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {createItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-xl bg-surface border border-border p-2.5"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          options={productOptions}
                          placeholder={
                            createSupplier
                              ? productOptions.length > 0
                                ? "Pilih produk..."
                                : "Tidak ada produk"
                              : "Pilih supplier dulu"
                          }
                          value={item.variantId}
                          onChange={(e) =>
                            updateCreateItem(index, "variantId", e.target.value)
                          }
                          disabled={!createSupplier || productOptions.length === 0}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.qty}
                            onChange={(e) =>
                              updateCreateItem(index, "qty", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Harga beli"
                            value={item.buyPrice}
                            onChange={(e) =>
                              updateCreateItem(
                                index,
                                "buyPrice",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      {createItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCreateItem(index)}
                          className="shrink-0 mt-0.5"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Running total */}
              {createTotal > 0 && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-muted-foreground">
                    Estimasi Total
                  </span>
                  <span className="text-sm font-bold font-num text-gradient">
                    {formatRupiah(createTotal)}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Catatan
                </label>
                <Input
                  placeholder="Catatan untuk pesanan (opsional)"
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
                <Button type="submit" disabled={isPending}>
                  <Plus size={15} />
                  {isPending ? "Membuat..." : "Buat PO"}
                </Button>
              </div>
            </form>
          </Dialog>
        </>
      )}

      {mainTab === "supplier" && (
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <SupplierTab initialSuppliers={suppliers} categories={categories} />
        </div>
      )}
    </div>
  );
}
