"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn, formatRupiah } from "@/lib/utils";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/lib/actions/promotions";
import {
  Plus,
  Pencil,
  Trash2,
  Percent,
  Tag,
  Gift,
  PackageOpen,
  CalendarRange,
  ShoppingBag,
  Loader2,
  Info,
} from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PromoTypeDB = "percentage" | "fixed" | "buy_x_get_y" | "bundle";
type TabFilter = "all" | "aktif" | "terjadwal" | "berakhir";

interface PromotionRow {
  id: string;
  name: string;
  description: string | null;
  type: PromoTypeDB;
  value: number;
  minPurchase: number | null;
  buyQty: number | null;
  getQty: number | null;
  freeProductId: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: "all" | "category" | "product";
  targetIds: string[] | null;
  createdAt: Date;
}

interface EditFormState {
  id: string;
  name: string;
  description: string;
  type: PromoTypeDB;
  isActive: boolean;
  value: number;
  minPurchase: number;
  buyQty: number | null;
  getQty: number | null;
  freeProductId: string | null;
  startDate: string;
  endDate: string;
  appliesTo: "all" | "category" | "product";
  targetIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const promoTabs = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "aktif" },
  { label: "Terjadwal", value: "terjadwal" },
  { label: "Berakhir", value: "berakhir" },
];

const typeOptions = [
  { label: "Diskon Persentase", value: "percentage" },
  { label: "Diskon Nominal", value: "fixed" },
  { label: "Beli X Gratis Y", value: "buy_x_get_y" },
  { label: "Bundle", value: "bundle" },
];

const activeOptions = [
  { label: "Ya", value: "ya" },
  { label: "Tidak", value: "tidak" },
];

const typeBadge: Record<
  PromoTypeDB,
  { label: string; variant: "default" | "success" | "warning" | "outline" }
> = {
  percentage: { label: "Diskon %", variant: "default" },
  fixed: { label: "Diskon Rp", variant: "success" },
  buy_x_get_y: { label: "Beli X Gratis Y", variant: "warning" },
  bundle: { label: "Bundle", variant: "outline" },
};

const accentBorder: Record<PromoTypeDB, string> = {
  percentage: "border-l-2 border-l-emerald-500/50",
  fixed: "border-l-2 border-l-cyan-500/50",
  buy_x_get_y: "border-l-2 border-l-amber-500/50",
  bundle: "border-l-2 border-l-violet-500/50",
};

const typeIcon: Record<PromoTypeDB, React.ReactNode> = {
  percentage: <Percent size={18} className="text-accent" />,
  fixed: <Tag size={18} className="text-cyan-400" />,
  buy_x_get_y: <Gift size={18} className="text-amber-400" />,
  bundle: <PackageOpen size={18} className="text-violet-400" />,
};

const typeIconBg: Record<PromoTypeDB, string> = {
  percentage:
    "bg-gradient-to-br from-violet-500/20 to-indigo-600/20 shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]",
  fixed:
    "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]",
  buy_x_get_y:
    "bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]",
  bundle:
    "bg-gradient-to-br from-violet-500/20 to-purple-500/20 shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]",
};

function deriveStatus(promo: PromotionRow): "aktif" | "terjadwal" | "berakhir" {
  if (!promo.isActive) return "berakhir";
  const today = new Date().toISOString().split("T")[0];
  if (promo.startDate > today) return "terjadwal";
  if (promo.endDate < today) return "berakhir";
  return "aktif";
}

const statusBadge: Record<
  "aktif" | "terjadwal" | "berakhir",
  { label: string; variant: "success" | "warning" | "outline" }
> = {
  aktif: { label: "Aktif", variant: "success" },
  terjadwal: { label: "Terjadwal", variant: "warning" },
  berakhir: { label: "Berakhir", variant: "outline" },
};

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => {
    const date = new Date(d);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };
  const endDate = new Date(end);
  return `${fmt(start)} - ${fmt(end)} ${endDate.getFullYear()}`;
}

function getPromoValueLabel(promo: PromotionRow, productsList?: OptionItem[]) {
  switch (promo.type) {
    case "percentage":
      return `${promo.value}%`;
    case "fixed":
      return formatRupiah(promo.value);
    case "buy_x_get_y": {
      const freeName = promo.freeProductId
        ? productsList?.find((p) => p.id === promo.freeProductId)?.name
        : null;
      return `Beli ${promo.buyQty ?? 0} Gratis 1${freeName ? ` ${freeName}` : ""}`;
    }
    case "bundle":
      return formatRupiah(promo.value);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OptionItem {
  id: string;
  name: string;
}

interface Props {
  initialPromotions: PromotionRow[];
  categories?: OptionItem[];
  products?: OptionItem[];
}

const appliesToOptions = [
  { label: "Semua Produk", value: "all" },
  { label: "Kategori Tertentu", value: "category" },
  { label: "Produk Tertentu", value: "product" },
];

export default function PromosiClient({ initialPromotions, categories = [], products = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<TabFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<PromoTypeDB>("percentage");

  // Create form fields
  const [formName, setFormName] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formBuyQty, setFormBuyQty] = useState("");
  const [formGetQty, setFormGetQty] = useState("");
  const [formMinPurchase, setFormMinPurchase] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState("ya");
  const [formDescription, setFormDescription] = useState("");
  const [formAppliesTo, setFormAppliesTo] = useState<"all" | "category" | "product">("all");
  const [formTargetIds, setFormTargetIds] = useState<string[]>([]);
  const [formFreeProductId, setFormFreeProductId] = useState("");

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [promotions, setPromotions] = useState(initialPromotions);
  useEffect(() => { setPromotions(initialPromotions); }, [initialPromotions]);

  const filtered = promotions.filter((p) => {
    if (tab === "all") return true;
    return deriveStatus(p) === tab;
  });

  const valueLabel = (() => {
    switch (formType) {
      case "percentage":
        return "Nilai Diskon (%)";
      case "fixed":
        return "Nilai Diskon (Rp)";
      case "buy_x_get_y":
        return "Jumlah Beli";
      case "bundle":
        return "Harga Bundle (Rp)";
    }
  })();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function resetCreateForm() {
    setFormName("");
    setFormValue("");
    setFormBuyQty("");
    setFormGetQty("");
    setFormMinPurchase("");
    setFormStartDate("");
    setFormEndDate("");
    setFormIsActive("ya");
    setFormDescription("");
    setFormType("percentage");
    setFormAppliesTo("all");
    setFormTargetIds([]);
    setFormFreeProductId("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createPromotion({
          name: formName,
          description: formDescription || undefined,
          type: formType,
          value: parseInt(formValue) || 0,
          minPurchase: formMinPurchase ? parseInt(formMinPurchase) : undefined,
          buyQty: formType === "buy_x_get_y" ? parseInt(formBuyQty) || undefined : undefined,
          getQty: formType === "buy_x_get_y" ? parseInt(formGetQty) || undefined : undefined,
          freeProductId: formType === "buy_x_get_y" && formFreeProductId ? formFreeProductId : undefined,
          startDate: formStartDate,
          endDate: formEndDate,
          appliesTo: formAppliesTo,
          targetIds: formAppliesTo !== "all" ? formTargetIds : undefined,
        });
        toast.success("Promosi berhasil dibuat");
        resetCreateForm();
        setFormOpen(false);
        router.refresh();
      } catch {
        toast.error("Gagal membuat promosi");
      }
    });
  }

  function openEdit(promo: PromotionRow) {
    setEditForm({
      id: promo.id,
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      isActive: promo.isActive,
      value: promo.value,
      minPurchase: promo.minPurchase ?? 0,
      buyQty: promo.buyQty,
      getQty: promo.getQty,
      freeProductId: promo.freeProductId,
      startDate: promo.startDate,
      endDate: promo.endDate,
      appliesTo: promo.appliesTo,
      targetIds: promo.targetIds ?? [],
    });
    setEditOpen(true);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    startTransition(async () => {
      try {
        await updatePromotion(editForm.id, {
          name: editForm.name,
          description: editForm.description,
          isActive: editForm.isActive,
          value: editForm.value,
          minPurchase: editForm.minPurchase,
          buyQty: editForm.buyQty,
          getQty: editForm.getQty,
          freeProductId: editForm.type === "buy_x_get_y" ? editForm.freeProductId : null,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          appliesTo: editForm.appliesTo,
          targetIds: editForm.appliesTo !== "all" ? editForm.targetIds : [],
        });
        toast.success("Promosi berhasil diperbarui");
        setEditOpen(false);
        setEditForm(null);
        router.refresh();
      } catch {
        toast.error("Gagal memperbarui promosi");
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deletePromotion(deleteId);
        toast.success("Promosi berhasil dihapus");
        setDeleteId(null);
        router.refresh();
      } catch {
        toast.error("Gagal menghapus promosi");
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
            Promosi & Diskon
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola promosi dan diskon untuk meningkatkan penjualan
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={15} />
          Buat Promosi
        </Button>
      </div>

      {/* Tabs */}
      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Tabs tabs={promoTabs} value={tab} onChange={(v) => setTab(v as TabFilter)} />
      </div>

      {/* Promo Cards Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        {filtered.map((promo, idx) => {
          const status = deriveStatus(promo);
          return (
            <Card
              key={promo.id}
              hover
              className={cn("p-0 overflow-hidden", accentBorder[promo.type])}
              style={{ animationDelay: `${140 + idx * 40}ms` }}
            >
              <div className="p-4 space-y-3">
                {/* Top: icon + name + badges */}
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      typeIconBg[promo.type]
                    )}
                  >
                    {typeIcon[promo.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {promo.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant={typeBadge[promo.type].variant}>
                        {typeBadge[promo.type].label}
                      </Badge>
                      <Badge variant={statusBadge[status].variant}>
                        {statusBadge[status].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Value */}
                <div className="px-3 py-2 rounded-xl bg-card border border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {promo.type === "buy_x_get_y"
                      ? "Promo"
                      : promo.type === "bundle"
                        ? "Harga Paket"
                        : "Nilai Diskon"}
                  </p>
                  <p className="text-lg font-bold font-num text-foreground mt-0.5">
                    {getPromoValueLabel(promo, products)}
                  </p>
                  {promo.type === "buy_x_get_y" && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Beli {promo.buyQty ?? 0} item, gratis 1 produk tertentu
                    </p>
                  )}
                  {promo.type === "bundle" && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Harga spesial paket bundle
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarRange size={13} className="shrink-0 opacity-50" />
                    <span>{formatDateRange(promo.startDate, promo.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingBag size={13} className="shrink-0 opacity-50" />
                    <span className="truncate">
                      {promo.appliesTo === "all"
                        ? "Semua Produk"
                        : promo.appliesTo === "category"
                          ? (promo.targetIds ?? []).map((id) => categories.find((c) => c.id === id)?.name || id).join(", ") || "Semua Kategori"
                          : (promo.targetIds ?? []).map((id) => products.find((p) => p.id === id)?.name || id).join(", ") || "Semua Produk"}
                    </span>
                  </div>
                  {promo.minPurchase != null && promo.minPurchase > 0 && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Min. pembelian {formatRupiah(promo.minPurchase)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(promo)}
                    disabled={isPending}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(promo.id)}
                    disabled={isPending}
                  >
                    <Trash2 size={13} className="text-destructive/60" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
          <Tag size={32} className="text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">
            Tidak ada promosi ditemukan
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Coba pilih tab lain atau buat promosi baru
          </p>
        </div>
      )}

      {/* ================================================================= */}
      {/* Create Promo Dialog                                                */}
      {/* ================================================================= */}
      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetCreateForm();
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setFormOpen(false);
            resetCreateForm();
          }}
        />
        <DialogHeader>
          <DialogTitle>Buat Promosi Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Promosi
            </label>
            <Input
              placeholder="Masukkan nama promosi"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Deskripsi
            </label>
            <Input
              placeholder="Deskripsi promosi (opsional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tipe Promosi
            </label>
            <Select
              options={typeOptions}
              placeholder="Pilih tipe promosi"
              value={formType}
              onChange={(e) => setFormType(e.target.value as PromoTypeDB)}
            />
          </div>

          {/* ---- Type-specific fields ---- */}
          {formType === "buy_x_get_y" && (
            <div className="space-y-3">
              {/* Info box */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/80 space-y-1">
                  <p className="font-medium text-amber-300">Cara kerja Beli X Gratis Y:</p>
                  <p>Pelanggan membeli <strong>X item (produk apapun)</strong>, lalu mendapatkan <strong>1 produk tertentu gratis</strong>.</p>
                  <p>Contoh: <strong>Beli 2 item</strong> produk apapun, <strong>gratis 1 Aksesoris</strong>. Produk gratis harus ditambahkan ke keranjang oleh kasir.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Jumlah Item yang Harus Dibeli (X)
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="2"
                  value={formBuyQty}
                  onChange={(e) => setFormBuyQty(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground/60">Pelanggan harus membeli minimal X item untuk mendapat gratis</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Produk yang Digratiskan
                </label>
                <Select
                  options={[
                    { label: "— Pilih produk gratis —", value: "" },
                    ...products.map((p) => ({ label: p.name, value: p.id })),
                  ]}
                  value={formFreeProductId}
                  onChange={(e) => setFormFreeProductId(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground/60">
                  Produk ini akan digratiskan 1 unit saat pelanggan memenuhi syarat beli
                </p>
              </div>

              {/* Preview */}
              {formBuyQty && formFreeProductId && (
                <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                  <p className="text-xs text-muted-foreground">Preview promosi:</p>
                  <p className="text-sm font-semibold text-amber-400 mt-0.5">
                    Beli {formBuyQty} Item, Gratis 1 {products.find((p) => p.id === formFreeProductId)?.name || ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Kasir tambahkan produk gratis ke keranjang, harga otomatis Rp 0
                  </p>
                </div>
              )}
            </div>
          )}

          {formType === "bundle" && (
            <div className="space-y-3">
              {/* Info box */}
              <div className="flex gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-violet-200/80 space-y-1">
                  <p className="font-medium text-violet-300">Cara kerja Bundle:</p>
                  <p>Beberapa produk dijual bersama dalam satu paket dengan <strong>harga spesial</strong> yang lebih murah dari total harga individual.</p>
                  <p>Contoh: Shampoo (Rp25.000) + Conditioner (Rp20.000) = Bundle <strong>Rp40.000</strong> (hemat Rp5.000).</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Harga Bundle (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Contoh: 40000"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground/60">
                  Harga total paket bundle yang akan dikenakan ke pelanggan
                </p>
              </div>

              {/* Preview */}
              {formValue && (
                <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                  <p className="text-xs text-muted-foreground">Harga bundle:</p>
                  <p className="text-sm font-semibold text-violet-400 mt-0.5">
                    {formatRupiah(parseInt(formValue) || 0)}
                  </p>
                </div>
              )}
            </div>
          )}

          {(formType === "percentage" || formType === "fixed") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {valueLabel}
              </label>
              <Input
                type="number"
                min="0"
                placeholder={formType === "percentage" ? "Contoh: 10" : "Contoh: 5000"}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground/60">
                {formType === "percentage"
                  ? "Persentase diskon yang diberikan (1-100%)"
                  : "Potongan harga dalam Rupiah"}
              </p>
            </div>
          )}

          {formType !== "buy_x_get_y" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Min. Pembelian (Rp)
              </label>
              <Input
                type="number"
                placeholder="0 (opsional)"
                value={formMinPurchase}
                onChange={(e) => setFormMinPurchase(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground/60">
                Minimum total belanja agar promosi berlaku (kosongkan jika tidak ada minimum)
              </p>
            </div>
          )}

          {/* Berlaku Untuk */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Berlaku Untuk
            </label>
            <Select
              options={appliesToOptions}
              value={formAppliesTo}
              onChange={(e) => {
                setFormAppliesTo(e.target.value as "all" | "category" | "product");
                setFormTargetIds([]);
              }}
            />
          </div>

          {/* Target selection */}
          {formAppliesTo !== "all" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Pilih {formAppliesTo === "category" ? "Kategori" : "Produk"}
              </label>
              <div className="max-h-[140px] overflow-y-auto rounded-xl border border-border bg-card p-2 space-y-1">
                {(formAppliesTo === "category" ? categories : products).map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs",
                      formTargetIds.includes(item.id)
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formTargetIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormTargetIds((prev) => [...prev, item.id]);
                        } else {
                          setFormTargetIds((prev) => prev.filter((id) => id !== item.id));
                        }
                      }}
                      className="accent-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="truncate">{item.name}</span>
                  </label>
                ))}
                {(formAppliesTo === "category" ? categories : products).length === 0 && (
                  <p className="text-[10px] text-muted-dim text-center py-2">
                    Tidak ada {formAppliesTo === "category" ? "kategori" : "produk"} tersedia
                  </p>
                )}
              </div>
              {formTargetIds.length > 0 && (
                <p className="text-[10px] text-muted-foreground/60">
                  {formTargetIds.length} {formAppliesTo === "category" ? "kategori" : "produk"} dipilih
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tanggal Berakhir
              </label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Aktif
            </label>
            <Select
              options={activeOptions}
              placeholder="Pilih status"
              value={formIsActive}
              onChange={(e) => setFormIsActive(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                resetCreateForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Simpan Promosi
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ================================================================= */}
      {/* Edit Promo Dialog                                                  */}
      {/* ================================================================= */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditForm(null);
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
        />
        <DialogHeader>
          <DialogTitle>Edit Promosi</DialogTitle>
        </DialogHeader>

        {editForm && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Promosi
              </label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Deskripsi
              </label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {editForm.type === "percentage" ? "Nilai Diskon (%)" :
                 editForm.type === "bundle" ? "Harga Bundle (Rp)" :
                 editForm.type === "fixed" ? "Nilai Diskon (Rp)" : "Nilai"}
              </label>
              <Input
                type="number"
                value={editForm.value}
                onChange={(e) =>
                  setEditForm({ ...editForm, value: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>

            {/* Buy X Get Y fields */}
            {editForm.type === "buy_x_get_y" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Jumlah Item yang Harus Dibeli (X)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editForm.buyQty ?? ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, buyQty: parseInt(e.target.value) || null })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Produk yang Digratiskan
                  </label>
                  <Select
                    options={[
                      { label: "— Pilih produk gratis —", value: "" },
                      ...products.map((p) => ({ label: p.name, value: p.id })),
                    ]}
                    value={editForm.freeProductId || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, freeProductId: e.target.value || null })
                    }
                    required
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    1 unit produk ini akan digratiskan
                  </p>
                </div>
              </div>
            )}

            {/* Min purchase for non buy_x_get_y */}
            {editForm.type !== "buy_x_get_y" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min. Pembelian (Rp)
                </label>
                <Input
                  type="number"
                  value={editForm.minPurchase || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, minPurchase: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}

            {/* Berlaku Untuk */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Berlaku Untuk
              </label>
              <Select
                options={appliesToOptions}
                value={editForm.appliesTo}
                onChange={(e) =>
                  setEditForm({ ...editForm, appliesTo: e.target.value as "all" | "category" | "product", targetIds: [] })
                }
              />
            </div>

            {/* Target selection */}
            {editForm.appliesTo !== "all" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Pilih {editForm.appliesTo === "category" ? "Kategori" : "Produk"}
                </label>
                <div className="max-h-[140px] overflow-y-auto rounded-xl border border-border bg-card p-2 space-y-1">
                  {(editForm.appliesTo === "category" ? categories : products).map((item) => (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs",
                        editForm.targetIds.includes(item.id)
                          ? "bg-accent/10 text-accent"
                          : "text-muted-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.targetIds.includes(item.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...editForm.targetIds, item.id]
                            : editForm.targetIds.filter((id) => id !== item.id);
                          setEditForm({ ...editForm, targetIds: newIds });
                        }}
                        className="accent-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{item.name}</span>
                    </label>
                  ))}
                </div>
                {editForm.targetIds.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {editForm.targetIds.length} {editForm.appliesTo === "category" ? "kategori" : "produk"} dipilih
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tanggal Berakhir
                </label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Aktif
              </label>
              <Select
                options={activeOptions}
                value={editForm.isActive ? "ya" : "tidak"}
                onChange={(e) =>
                  setEditForm({ ...editForm, isActive: e.target.value === "ya" })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditOpen(false);
                  setEditForm(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ================================================================= */}
      {/* Delete Confirm Dialog                                              */}
      {/* ================================================================= */}
      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        className="max-w-sm"
      >
        <DialogClose onClose={() => setDeleteId(null)} />
        <DialogHeader>
          <DialogTitle>Hapus Promosi</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Apakah Anda yakin ingin menghapus promosi ini? Tindakan ini tidak dapat
          dibatalkan.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Hapus
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
