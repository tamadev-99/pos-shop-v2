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
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Scale,
} from "lucide-react";
import { useState, useTransition } from "react";
import { createTransaction } from "@/lib/actions/finance";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateTransactionForm {
  type: "pemasukan" | "pengeluaran";
  category: string;
  description: string;
  amount: string;
  date: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const tabOptions = [
  { label: "Semua", value: "all" },
  { label: "Pemasukan", value: "pemasukan" },
  { label: "Pengeluaran", value: "pengeluaran" },
];

const typeOptions = [
  { label: "Pemasukan", value: "pemasukan" },
  { label: "Pengeluaran", value: "pengeluaran" },
];

const categoryOptions = [
  { label: "Penjualan", value: "Penjualan" },
  { label: "Pembelian Stok", value: "Pembelian Stok" },
  { label: "Gaji", value: "Gaji" },
  { label: "Sewa", value: "Sewa" },
  { label: "Utilitas", value: "Utilitas" },
  { label: "Lainnya", value: "Lainnya" },
];

const typeVariant: Record<string, BadgeVariant> = {
  pemasukan: "success",
  pengeluaran: "destructive",
};

const typeLabel: Record<string, string> = {
  pemasukan: "Pemasukan",
  pengeluaran: "Pengeluaran",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType = "pemasukan" | "pengeluaran";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
}

interface KeuanganClientProps {
  initialTransactions: Transaction[];
  saldoKas: number;
  todayReconciliation: {
    income: number;
    expense: number;
    net: number;
  };
}

const emptyForm = (): CreateTransactionForm => ({
  type: "pemasukan",
  category: "",
  description: "",
  amount: "",
  date: "2026-02-28",
  notes: "",
});

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function KeuanganClient({
  initialTransactions,
  saldoKas,
  todayReconciliation,
}: KeuanganClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateTransactionForm>(emptyForm());

  const totalPemasukan = initialTransactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = initialTransactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + t.amount, 0);

  const labaBersih = totalPemasukan - totalPengeluaran;

  const filtered = initialTransactions.filter((t) => {
    if (activeTab === "all") return true;
    return t.type === activeTab;
  });

  const openingBalance = saldoKas - todayReconciliation.income + todayReconciliation.expense;
  const expectedClosing = saldoKas;

  // ---------------------------------------------------------------------------
  // Form Handlers
  // ---------------------------------------------------------------------------

  function updateForm<K extends keyof CreateTransactionForm>(
    field: K,
    value: CreateTransactionForm[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createTransaction({
          date: form.date,
          type: form.type === "pemasukan" ? "masuk" : "keluar",
          category: form.category,
          description: form.description,
          amount: parseInt(form.amount) || 0,
        });
        toast.success("Transaksi berhasil ditambahkan");
        resetForm();
        setCreateOpen(false);
        router.refresh();
      } catch (error) {
        toast.error("Gagal menambahkan transaksi");
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
            Keuangan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola arus kas, pemasukan, dan pengeluaran toko
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Tambah Transaksi
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 stagger">
        {/* Saldo Kas */}
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="success"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <Wallet size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Saldo Kas
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(saldoKas)}
            </p>
          </div>
        </Card>

        {/* Pemasukan Bulan Ini */}
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="accent"
          style={{ animationDelay: "40ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]">
            <TrendingUp size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              Pemasukan Bulan Ini
              <ArrowUpRight size={12} className="text-emerald-400" />
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(totalPemasukan)}
            </p>
          </div>
        </Card>

        {/* Pengeluaran Bulan Ini */}
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="destructive"
          style={{ animationDelay: "80ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(244,63,94,0.25)]">
            <TrendingDown size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              Pengeluaran Bulan Ini
              <ArrowDownRight size={12} className="text-rose-400" />
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(totalPengeluaran)}
            </p>
          </div>
        </Card>

        {/* Laba Bersih */}
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            <BarChart3 size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Laba Bersih
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(labaBersih)}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up"
        style={{ animationDelay: "160ms" }}
      >
        <Tabs tabs={tabOptions} value={activeTab} onChange={setActiveTab} />
      </div>

      {/* Transaction Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Kategori
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-foreground">
                    {txn.description}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {txn.category}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge variant={typeVariant[txn.type]}>
                      {typeLabel[txn.type]}
                    </Badge>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold font-num text-right whitespace-nowrap">
                    <span
                      className={
                        txn.type === "pemasukan"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {txn.type === "pemasukan" ? "+" : "-"}
                      {formatRupiah(txn.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <FileText size={28} className="mx-auto mb-2 opacity-10" />
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daily Reconciliation Card */}
      <Card
        className="p-4 md:p-5 animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_12px_-4px_rgba(245,158,11,0.25)]">
            <Scale size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
              Rekonsiliasi Harian
            </h2>
            <p className="text-[10px] text-muted-foreground">
              28 Februari 2026
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Opening Balance */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Saldo Awal
            </p>
            <p className="text-sm md:text-base font-bold font-num text-foreground">
              {formatRupiah(openingBalance)}
            </p>
          </div>

          {/* Cash In */}
          <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08] p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-emerald-400/80 uppercase tracking-wider mb-1">
              Kas Masuk
            </p>
            <p className="text-sm md:text-base font-bold font-num text-emerald-400">
              +{formatRupiah(todayReconciliation.income)}
            </p>
          </div>

          {/* Cash Out */}
          <div className="rounded-xl bg-rose-500/[0.04] border border-rose-500/[0.08] p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-rose-400/80 uppercase tracking-wider mb-1">
              Kas Keluar
            </p>
            <p className="text-sm md:text-base font-bold font-num text-rose-400">
              -{formatRupiah(todayReconciliation.expense)}
            </p>
          </div>

          {/* Expected Closing */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Saldo Penutup
            </p>
            <p className="text-sm md:text-base font-bold font-num text-foreground">
              {formatRupiah(expectedClosing)}
            </p>
          </div>
        </div>
      </Card>

      {/* ================================================================= */}
      {/* Add Transaction Dialog                                             */}
      {/* ================================================================= */}
      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setCreateOpen(false);
            resetForm();
          }}
        />
        <DialogHeader>
          <DialogTitle>Tambah Transaksi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipe */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tipe Transaksi
            </label>
            <Select
              options={typeOptions}
              placeholder="Pilih tipe"
              value={form.type}
              onChange={(e) =>
                updateForm("type", e.target.value as TransactionType)
              }
            />
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Kategori
            </label>
            <Select
              options={categoryOptions}
              placeholder="Pilih kategori"
              value={form.category}
              onChange={(e) => updateForm("category", e.target.value)}
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Deskripsi
            </label>
            <Input
              placeholder="Contoh: Penjualan harian - Sabtu"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          {/* Jumlah */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Jumlah (Rp)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => updateForm("amount", e.target.value)}
            />
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tanggal
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => updateForm("date", e.target.value)}
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Catatan
            </label>
            <Input
              placeholder="Catatan tambahan (opsional)"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>

          {/* Preview */}
          {form.amount && (
            <div className="flex justify-between items-center px-1 py-2 border-t border-white/[0.06]">
              <span className="text-xs text-muted-foreground">
                Jumlah Transaksi
              </span>
              <span
                className={`text-sm font-bold font-num ${form.type === "pemasukan"
                  ? "text-emerald-400"
                  : "text-rose-400"
                  }`}
              >
                {form.type === "pemasukan" ? "+" : "-"}
                {formatRupiah(parseInt(form.amount) || 0)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              <Plus size={15} />
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
