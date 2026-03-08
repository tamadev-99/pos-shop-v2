"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  Save,
  Loader2,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStockOpname,
  getStockOpnameById,
  updateOpnameItem,
  submitForReview,
  approveStockOpname,
  rejectStockOpname,
  cancelStockOpname,
} from "@/lib/actions/stock-opname";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpnameStatus = "draft" | "in_progress" | "pending_review" | "completed" | "cancelled";

interface OpnameSummary {
  id: string;
  code: string;
  note: string | null;
  status: OpnameStatus;
  createdByName: string;
  reviewedByName: string | null;
  reviewNote: string | null;
  completedAt: Date | null;
  createdAt: Date;
  totalItems: number;
  diffCount: number;
}

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

interface OpnameItem {
  id: string;
  opnameId: string;
  variantId: string;
  systemStock: number;
  actualStock: number | null;
  difference: number | null;
  note: string | null;
  variantSku: string;
  variantBarcode: string;
  variantColor: string;
  variantSize: string;
  variantCurrentStock: number;
  productName: string;
  productBrand: string;
  categoryName: string;
}

interface OpnameDetail {
  id: string;
  code: string;
  note: string | null;
  status: OpnameStatus;
  createdByName: string;
  reviewedByName: string | null;
  reviewNote: string | null;
  completedAt: Date | null;
  createdAt: Date;
  items: OpnameItem[];
}

export interface StokOpnameTabProps {
  opnames: OpnameSummary[];
  variants: VariantFlat[];
  userRole: string;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const statusConfig: Record<
  OpnameStatus,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "outline" | "info" }
> = {
  draft: { label: "Draf", variant: "outline" },
  in_progress: { label: "Pengisian", variant: "warning" },
  pending_review: { label: "Menunggu Review", variant: "info" },
  completed: { label: "Disetujui", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StokOpnameTab({ opnames, variants, userRole }: StokOpnameTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isReviewer = userRole === "manager" || userRole === "owner";

  // Views
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create form
  const [createNote, setCreateNote] = useState("");
  const [createSearch, setCreateSearch] = useState("");
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Detail view
  const [detailData, setDetailData] = useState<OpnameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editActualStock, setEditActualStock] = useState("");
  const [editNote, setEditNote] = useState("");
  const [detailSearch, setDetailSearch] = useState("");

  // Dialogs
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState("");

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const filteredOpnames = opnames.filter((op) => {
    if (statusFilter !== "all" && op.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !op.code.toLowerCase().includes(q) &&
        !op.createdByName.toLowerCase().includes(q) &&
        !(op.note || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(variants.map((v) => v.categoryName))).sort();
    return [{ label: "Semua Kategori", value: "all" }, ...cats.map((c) => ({ label: c, value: c }))];
  }, [variants]);

  const filteredCreateVariants = useMemo(() => {
    return variants.filter((v) => {
      if (categoryFilter !== "all" && v.categoryName !== categoryFilter) return false;
      if (createSearch) {
        const q = createSearch.toLowerCase();
        if (
          !v.productName.toLowerCase().includes(q) &&
          !v.sku.toLowerCase().includes(q) &&
          !v.barcode.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [variants, categoryFilter, createSearch]);

  // Stats
  const pendingReviewCount = opnames.filter((o) => o.status === "pending_review").length;
  const activeCount = opnames.filter((o) => o.status === "in_progress").length;
  const completedCount = opnames.filter((o) => o.status === "completed").length;

  // Detail computed
  const detailFiltered = detailData?.items.filter((item) => {
    if (!detailSearch) return true;
    const q = detailSearch.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.variantSku.toLowerCase().includes(q)
    );
  }) || [];

  const detailStats = useMemo(() => {
    if (!detailData) return { total: 0, counted: 0, matched: 0, surplus: 0, deficit: 0 };
    const items = detailData.items;
    const counted = items.filter((i) => i.actualStock !== null).length;
    const matched = items.filter((i) => i.difference === 0).length;
    const surplus = items.filter((i) => i.difference !== null && i.difference > 0).length;
    const deficit = items.filter((i) => i.difference !== null && i.difference < 0).length;
    return { total: items.length, counted, matched, surplus, deficit };
  }, [detailData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleOpenCreate() {
    setCreateNote("");
    setCreateSearch("");
    setSelectedVariantIds(new Set());
    setCategoryFilter("all");
    setView("create");
  }

  function toggleVariant(id: string) {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredCreateVariants.map((v) => v.id);
    const allSelected = visibleIds.every((id) => selectedVariantIds.has(id));
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleCreateSubmit() {
    if (selectedVariantIds.size === 0) {
      toast.error("Pilih minimal 1 produk untuk diopname.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createStockOpname({
          note: createNote || undefined,
          variantIds: Array.from(selectedVariantIds),
        });
        toast.success(`Stok opname ${result.code} berhasil dibuat.`);
        setView("list");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat stok opname.");
      }
    });
  }

  async function handleOpenDetail(id: string) {
    setDetailLoading(true);
    setView("detail");
    setDetailSearch("");
    setEditingItemId(null);
    setReviewNoteInput("");
    try {
      const data = await getStockOpnameById(id);
      setDetailData(data as OpnameDetail);
    } catch {
      toast.error("Gagal memuat detail stok opname.");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleStartEdit(item: OpnameItem) {
    setEditingItemId(item.id);
    setEditActualStock(item.actualStock !== null ? String(item.actualStock) : "");
    setEditNote(item.note || "");
  }

  function handleSaveItem() {
    if (!editingItemId) return;
    const qty = parseInt(editActualStock);
    if (isNaN(qty) || qty < 0) {
      toast.error("Stok aktual harus berupa angka >= 0.");
      return;
    }
    startTransition(async () => {
      try {
        await updateOpnameItem(editingItemId!, qty, editNote || undefined);
        toast.success("Data berhasil disimpan.");
        if (detailData) {
          const data = await getStockOpnameById(detailData.id);
          setDetailData(data as OpnameDetail);
        }
        setEditingItemId(null);
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan.");
      }
    });
  }

  function handleSubmitForReview() {
    if (!detailData) return;
    startTransition(async () => {
      try {
        await submitForReview(detailData!.id);
        toast.success("Stok opname diajukan untuk review.");
        setConfirmSubmit(false);
        setView("list");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal mengajukan review.");
      }
    });
  }

  function handleApprove() {
    if (!detailData) return;
    startTransition(async () => {
      try {
        await approveStockOpname(detailData!.id, true, reviewNoteInput || undefined);
        toast.success("Stok opname disetujui. Stok telah disesuaikan.");
        setApproveDialogOpen(false);
        setView("list");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menyetujui.");
      }
    });
  }

  function handleReject() {
    if (!detailData) return;
    if (!reviewNoteInput.trim()) {
      toast.error("Berikan catatan alasan penolakan.");
      return;
    }
    startTransition(async () => {
      try {
        await rejectStockOpname(detailData!.id, reviewNoteInput);
        toast.success("Stok opname ditolak & dikembalikan untuk perbaikan.");
        setRejectDialogOpen(false);
        setView("list");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal menolak.");
      }
    });
  }

  function handleCancel() {
    if (!detailData) return;
    startTransition(async () => {
      try {
        await cancelStockOpname(detailData!.id);
        toast.success("Stok opname dibatalkan.");
        setConfirmCancel(false);
        setView("list");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Gagal membatalkan.");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render: CREATE VIEW
  // ---------------------------------------------------------------------------

  if (view === "create") {
    const allVisibleSelected = filteredCreateVariants.length > 0 &&
      filteredCreateVariants.every((v) => selectedVariantIds.has(v.id));

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ChevronLeft size={16} />
            Kembali
          </Button>
          <h2 className="text-sm font-semibold text-foreground">Buat Stok Opname Baru</h2>
        </div>

        <Card className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Catatan (opsional)
            </label>
            <Input
              placeholder="Contoh: Stok opname bulanan Maret 2026"
              value={createNote}
              onChange={(e) => setCreateNote(e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Pilih Produk</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih varian produk yang akan dihitung stoknya
              </p>
            </div>
            <Badge variant="default">{selectedVariantIds.size} dipilih</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Cari nama, SKU, atau barcode..."
              icon={<Search size={15} />}
              value={createSearch}
              onChange={(e) => setCreateSearch(e.target.value)}
              className="flex-1"
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sm:w-48"
            />
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                        className="rounded accent-[var(--color-accent)] cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Produk</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">SKU</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">Kategori</th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreateVariants.map((v) => {
                    const checked = selectedVariantIds.has(v.id);
                    return (
                      <tr
                        key={v.id}
                        onClick={() => toggleVariant(v.id)}
                        className={cn(
                          "border-b border-border last:border-0 cursor-pointer transition-colors",
                          checked ? "bg-accent-muted/30" : "hover:bg-white/[0.025]"
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVariant(v.id)}
                            className="rounded accent-[var(--color-accent)] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium text-foreground">{v.productName}</p>
                          <p className="text-[10px] text-muted-foreground">{v.color} / {v.size}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground font-num hidden sm:table-cell">{v.sku}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{v.categoryName}</td>
                        <td className="px-3 py-2.5 text-xs font-bold font-num text-right text-foreground">{formatNumber(v.stock)}</td>
                      </tr>
                    );
                  })}
                  {filteredCreateVariants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        <Package size={28} className="mx-auto mb-2 opacity-10" />
                        Tidak ada produk ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setView("list")}>Batal</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isPending || selectedVariantIds.size === 0}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <ClipboardCheck size={14} />}
              Mulai Opname ({selectedVariantIds.size} item)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: DETAIL VIEW
  // ---------------------------------------------------------------------------

  if (view === "detail") {
    if (detailLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      );
    }

    if (!detailData) return null;

    const status = detailData.status;
    const canInput = status === "in_progress";
    const canSubmitReview = status === "in_progress";
    const canReview = status === "pending_review" && isReviewer;
    const canCancel = (status === "in_progress" || status === "pending_review") && isReviewer;

    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setView("list"); setDetailData(null); }}>
              <ChevronLeft size={16} />
              Kembali
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-foreground font-num">{detailData.code}</h2>
                <Badge variant={statusConfig[status].variant}>
                  {statusConfig[status].label}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dibuat oleh {detailData.createdByName} &bull; {new Date(detailData.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Action buttons based on role + status */}
          <div className="flex gap-2 flex-wrap">
            {canCancel && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmCancel(true)}>
                <XCircle size={14} />
                Batalkan
              </Button>
            )}
            {canSubmitReview && (
              <Button size="sm" onClick={() => setConfirmSubmit(true)}>
                <Send size={14} />
                Ajukan Review
              </Button>
            )}
            {canReview && (
              <>
                <Button variant="destructive" size="sm" onClick={() => { setReviewNoteInput(""); setRejectDialogOpen(true); }}>
                  <RotateCcw size={14} />
                  Tolak
                </Button>
                <Button size="sm" onClick={() => { setReviewNoteInput(""); setApproveDialogOpen(true); }}>
                  <ShieldCheck size={14} />
                  Setujui
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Review info banner */}
        {status === "pending_review" && !isReviewer && (
          <Card className="p-3 border-info/20 bg-info/5">
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-info">Menunggu Review</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Data opname sudah diajukan dan sedang menunggu persetujuan dari Manager atau Owner.
                </p>
              </div>
            </div>
          </Card>
        )}

        {status === "pending_review" && isReviewer && (
          <Card className="p-3 border-info/20 bg-info/5">
            <div className="flex items-start gap-2">
              <UserCheck size={14} className="text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-info">Perlu Tindakan Anda</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Periksa data stok opname di bawah ini. Setujui untuk menyesuaikan stok sistem, atau tolak jika data perlu diperbaiki.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Rejection note banner */}
        {detailData.reviewNote && status === "in_progress" && (
          <Card className="p-3 border-warning/20 bg-warning/5">
            <div className="flex items-start gap-2">
              <MessageSquare size={14} className="text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-warning">Catatan dari Reviewer ({detailData.reviewedByName})</p>
                <p className="text-[11px] text-foreground mt-0.5">{detailData.reviewNote}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Approval info */}
        {status === "completed" && detailData.reviewedByName && (
          <Card className="p-3 border-success/20 bg-success/5">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-success">
                  Disetujui oleh {detailData.reviewedByName}
                  {detailData.completedAt && (
                    <span className="font-normal text-muted-foreground"> &bull; {new Date(detailData.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  )}
                </p>
                {detailData.reviewNote && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{detailData.reviewNote}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Note */}
        {detailData.note && (
          <Card className="p-3 flex items-start gap-2">
            <FileText size={14} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{detailData.note}</p>
          </Card>
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-3 flex items-center gap-3" hover>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
              <Package size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-base font-bold font-num text-foreground">{detailStats.total}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3" hover>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
              <ClipboardList size={16} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dihitung</p>
              <p className="text-base font-bold font-num text-foreground">{detailStats.counted}<span className="text-[10px] font-normal text-muted-foreground">/{detailStats.total}</span></p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3" hover>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cocok</p>
              <p className="text-base font-bold font-num text-success">{detailStats.matched}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3" hover>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Surplus</p>
              <p className="text-base font-bold font-num text-warning">{detailStats.surplus}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3" hover>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
              <TrendingDown size={16} className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Defisit</p>
              <p className="text-base font-bold font-num text-destructive">{detailStats.deficit}</p>
            </div>
          </Card>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-muted-foreground font-medium">Progress Penghitungan</p>
            <p className="text-[11px] text-muted-foreground font-num">
              {detailStats.counted}/{detailStats.total} ({detailStats.total > 0 ? Math.round((detailStats.counted / detailStats.total) * 100) : 0}%)
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-violet-500 transition-all duration-500"
              style={{ width: `${detailStats.total > 0 ? (detailStats.counted / detailStats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Items search */}
        <Input
          placeholder="Cari produk atau SKU..."
          icon={<Search size={15} />}
          value={detailSearch}
          onChange={(e) => setDetailSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />

        {/* Items table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Produk</th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-center">Stok Sistem</th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-center">Stok Aktual</th>
                  <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-center">Selisih</th>
                  {canInput && (
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {detailFiltered.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const hasDiff = item.difference !== null && item.difference !== 0;
                  const isCounted = item.actualStock !== null;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        hasDiff ? "bg-warning/[0.02]" : isCounted ? "bg-success/[0.02]" : "hover:bg-white/[0.025]"
                      )}
                    >
                      <td className="px-3 md:px-4 py-3">
                        <p className="text-xs font-medium text-foreground">{item.productName}</p>
                        <p className="text-[10px] text-muted-foreground">{item.variantColor} / {item.variantSize}</p>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">{item.variantSku}</td>
                      <td className="px-3 md:px-4 py-3 text-xs font-bold font-num text-center text-foreground">{formatNumber(item.systemStock)}</td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editActualStock}
                            onChange={(e) => setEditActualStock(e.target.value)}
                            className="w-20 mx-auto text-center"
                            min={0}
                            autoFocus
                          />
                        ) : (
                          <span className={cn("text-xs font-bold font-num", isCounted ? "text-foreground" : "text-muted-foreground/40")}>
                            {isCounted ? formatNumber(item.actualStock!) : "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {item.difference !== null ? (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-bold font-num",
                            item.difference === 0 ? "text-success" : item.difference > 0 ? "text-warning" : "text-destructive"
                          )}>
                            {item.difference === 0 ? <CheckCircle size={12} /> : item.difference > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {item.difference > 0 ? "+" : ""}{formatNumber(item.difference)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">-</span>
                        )}
                      </td>
                      {canInput && (
                        <td className="px-3 md:px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" onClick={handleSaveItem} disabled={isPending}>
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)}>
                                <XCircle size={12} />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleStartEdit(item)}>
                              <ArrowUpDown size={12} className="mr-1" />
                              Hitung
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {detailFiltered.length === 0 && (
                  <tr>
                    <td colSpan={canInput ? 6 : 5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <Package size={28} className="mx-auto mb-2 opacity-10" />
                      Tidak ada item ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Submit for Review confirm */}
        <ConfirmDialog
          open={confirmSubmit}
          onClose={() => setConfirmSubmit(false)}
          onConfirm={handleSubmitForReview}
          title="Ajukan Review?"
          description={`Data stok opname akan diajukan ke Manager/Owner untuk ditinjau. ${detailStats.total - detailStats.counted} item belum dihitung. Pastikan data sudah benar sebelum mengajukan.`}
          confirmLabel="Ajukan Review"
          variant="default"
          loading={isPending}
        />

        {/* Cancel confirm */}
        <ConfirmDialog
          open={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          onConfirm={handleCancel}
          title="Batalkan Stok Opname?"
          description="Data perhitungan tetap tersimpan namun tidak ada perubahan stok yang diterapkan."
          confirmLabel="Ya, Batalkan"
          variant="destructive"
          loading={isPending}
        />

        {/* Approve dialog */}
        <Dialog
          open={approveDialogOpen}
          onClose={() => setApproveDialogOpen(false)}
          className="max-w-md"
        >
          <DialogClose onClose={() => setApproveDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Setujui Stok Opname</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-surface border border-border p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total item</span>
                <span className="font-bold font-num text-foreground">{detailStats.total}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sudah dihitung</span>
                <span className="font-bold font-num text-foreground">{detailStats.counted}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cocok</span>
                <span className="font-bold font-num text-success">{detailStats.matched}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ada selisih</span>
                <span className="font-bold font-num text-warning">{detailStats.surplus + detailStats.deficit}</span>
              </div>
            </div>
            <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
              <p className="text-xs text-accent font-medium">Stok sistem akan disesuaikan dengan data stok aktual untuk semua item yang memiliki selisih.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catatan review (opsional)</label>
              <Input
                placeholder="Tambahkan catatan..."
                value={reviewNoteInput}
                onChange={(e) => setReviewNoteInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setApproveDialogOpen(false)}>Batal</Button>
              <Button onClick={handleApprove} disabled={isPending}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Setujui & Sesuaikan Stok
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Reject dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          className="max-w-md"
        >
          <DialogClose onClose={() => setRejectDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Tolak Stok Opname</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Opname akan dikembalikan ke status &quot;Pengisian&quot; agar karyawan dapat memperbaiki data. Berikan catatan agar karyawan tahu apa yang perlu diperbaiki.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Alasan penolakan <span className="text-destructive">*</span></label>
              <Input
                placeholder="Contoh: Data stok rak B belum lengkap, perlu dihitung ulang"
                value={reviewNoteInput}
                onChange={(e) => setReviewNoteInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isPending || !reviewNoteInput.trim()}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Tolak & Kembalikan
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: LIST VIEW
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-foreground">Stok Opname</h2>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus size={14} />
          Buat Opname Baru
        </Button>
      </div>

      {/* Stats */}
      <div className={cn("grid gap-3 md:gap-4", isReviewer ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
        {isReviewer && (
          <Card className="p-3 md:p-4 flex items-center gap-3" hover>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(56,189,248,0.25)]">
              <UserCheck size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Perlu Review</p>
              <p className={cn("text-lg md:text-xl font-bold font-num", pendingReviewCount > 0 ? "text-info" : "text-foreground")}>{pendingReviewCount}</p>
            </div>
          </Card>
        )}
        <Card className="p-3 md:p-4 flex items-center gap-3" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <Clock size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Pengisian</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{activeCount}</p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Disetujui</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{completedCount}</p>
          </div>
        </Card>
        {!isReviewer && (
          <Card className="p-3 md:p-4 flex items-center gap-3" hover>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(56,189,248,0.25)]">
              <Send size={18} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Menunggu Review</p>
              <p className="text-lg md:text-xl font-bold font-num text-foreground">{pendingReviewCount}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Cari kode atau catatan..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-xs"
        />
        <Select
          options={[
            { label: "Semua Status", value: "all" },
            { label: "Pengisian", value: "in_progress" },
            { label: "Menunggu Review", value: "pending_review" },
            { label: "Disetujui", value: "completed" },
            { label: "Dibatalkan", value: "cancelled" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {/* Opname list */}
      <div className="space-y-2">
        {filteredOpnames.map((op) => {
          const config = statusConfig[op.status];
          const ts = new Date(op.createdAt);
          const needsReview = op.status === "pending_review" && isReviewer;

          return (
            <Card
              key={op.id}
              className={cn(
                "p-3 md:p-4 cursor-pointer transition-all hover:border-border-strong",
                needsReview && "border-info/20 bg-info/[0.02]"
              )}
              onClick={() => handleOpenDetail(op.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    needsReview
                      ? "bg-gradient-to-br from-sky-500/20 to-indigo-500/20"
                      : "bg-gradient-to-br from-violet-500/20 to-indigo-500/20"
                  )}>
                    {needsReview ? (
                      <UserCheck size={16} className="text-sky-400" />
                    ) : (
                      <ClipboardCheck size={16} className="text-violet-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground font-num">{op.code}</p>
                      <Badge variant={config.variant}>{config.label}</Badge>
                      {needsReview && (
                        <Badge variant="info">Perlu Review</Badge>
                      )}
                    </div>
                    {op.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{op.note}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-dim">
                      <span>{op.createdByName}</span>
                      <span className="font-num">{ts.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold font-num text-foreground">{op.totalItems} item</p>
                    {op.diffCount > 0 && (
                      <p className="text-[10px] font-num text-warning">{op.diffCount} selisih</p>
                    )}
                  </div>
                  <Eye size={14} className="text-muted-dim" />
                </div>
              </div>
            </Card>
          );
        })}

        {filteredOpnames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck size={32} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Belum ada stok opname</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Buat stok opname baru untuk mulai menghitung stok fisik
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
