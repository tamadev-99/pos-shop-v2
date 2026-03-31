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
  Download,
  RefreshCw,
  Trash2,
  Settings2,
  Paperclip,
  Link2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { createTransaction, saveDailyReconciliation } from "@/lib/actions/finance";
import { createExpenseCategory, deleteExpenseCategory, createRecurringExpense, deleteRecurringExpense } from "@/lib/actions/expense-tracker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-csv";

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
  attachmentUrl: string;
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

// categoryOptions are now dynamic from props

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
  attachmentUrl?: string | null;
  employee?: { name: string } | null;
  createdByUser?: { name: string } | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  type: "pemasukan" | "pengeluaran";
  isDefault: boolean;
}

interface RecurringExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
}

export interface KeuanganTabProps {
  initialTransactions: Transaction[];
  saldoKas: number;
  todayReconciliation: {
    income: number;
    expense: number;
    net: number;
  };
  todayReconciliationLog: {
    id: string;
    calculatedIncome: number;
    calculatedExpense: number;
    actualCashInHand: number;
    difference: number;
    notes: string | null;
    status: "draft" | "completed";
  } | null;
  expenseCategories?: ExpenseCategory[];
  recurringExpenses?: RecurringExpense[];
}

const emptyForm = (): CreateTransactionForm => ({
  type: "pemasukan",
  category: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  attachmentUrl: "",
});

const frequencyOptions = [
  { label: "Harian", value: "harian" },
  { label: "Mingguan", value: "mingguan" },
  { label: "Bulanan", value: "bulanan" },
  { label: "Tahunan", value: "tahunan" },
];

const frequencyLabel: Record<string, string> = {
  harian: "Harian",
  mingguan: "Mingguan",
  bulanan: "Bulanan",
  tahunan: "Tahunan",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export function KeuanganTab({
  initialTransactions,
  saldoKas,
  todayReconciliation,
  todayReconciliationLog,
  expenseCategories = [],
  recurringExpenses = [],
}: KeuanganTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateTransactionForm>(emptyForm());
  const [reconDialogOpen, setReconDialogOpen] = useState(false);
  const [reconForm, setReconForm] = useState({
    actualCashInHand: String(todayReconciliationLog?.actualCashInHand || (saldoKas - todayReconciliation.income + todayReconciliation.expense)),
    notes: todayReconciliationLog?.notes || "",
  });

  // Category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"masuk" | "keluar">("keluar");

  // Recurring expenses
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    description: "",
    category: "",
    amount: "",
    frequency: "bulanan",
    nextDueDate: new Date().toISOString().split("T")[0],
  });

  // Build dynamic category options from props
  const categoryOptions = expenseCategories.map((c) => ({
    label: c.name,
    value: c.name,
  }));

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

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      try {
        await createExpenseCategory({ name: newCategoryName.trim(), type: newCategoryType });
        toast.success(`Kategori "${newCategoryName}" ditambahkan`);
        setNewCategoryName("");
        router.refresh();
      } catch {
        toast.error("Gagal menambahkan kategori");
      }
    });
  }

  function handleReconciliationSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const cashObj = parseInt(reconForm.actualCashInHand.replace(/\D/g, "")) || 0;
        await saveDailyReconciliation({
          date: new Date().toISOString().split("T")[0],
          calculatedIncome: todayReconciliation.income,
          calculatedExpense: todayReconciliation.expense,
          actualCashInHand: cashObj,
          notes: reconForm.notes,
        });
        toast.success("Rekonsiliasi harian berhasil disimpan");
        setReconDialogOpen(false);
        router.refresh();
      } catch (error) {
        toast.error("Gagal menyimpan rekonsiliasi");
      }
    });
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      try {
        await deleteExpenseCategory(id);
        toast.success("Kategori dihapus");
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Gagal menghapus kategori");
      }
    });
  }

  function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRecurringExpense({
          description: recurringForm.description,
          category: recurringForm.category,
          amount: parseInt(recurringForm.amount) || 0,
          frequency: recurringForm.frequency as any,
          nextDueDate: recurringForm.nextDueDate,
        });
        toast.success("Pengeluaran berulang ditambahkan");
        setRecurringForm({ description: "", category: "", amount: "", frequency: "bulanan", nextDueDate: new Date().toISOString().split("T")[0] });
        setRecurringDialogOpen(false);
        router.refresh();
      } catch {
        toast.error("Gagal menambahkan pengeluaran berulang");
      }
    });
  }

  function handleDeleteRecurring(id: string) {
    startTransition(async () => {
      try {
        await deleteRecurringExpense(id);
        toast.success("Pengeluaran berulang dihapus");
        router.refresh();
      } catch {
        toast.error("Gagal menghapus");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Tab Header (Opsional, karena sudah di dalam tab) */}
      <div className="flex justify-between items-center animate-fade-up">
        <h2 className="text-sm font-semibold text-foreground">Catatan Kas Operasional</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const data = filtered.map((t) => ({
                Tanggal: t.date,
                Deskripsi: t.description,
                Kategori: t.category,
                Tipe: typeLabel[t.type] || t.type,
                Jumlah: t.type === "pemasukan" ? t.amount : -t.amount,
              }));
              exportToCSV(data, "keuangan", [
                { key: "Tanggal", label: "Tanggal" },
                { key: "Deskripsi", label: "Deskripsi" },
                { key: "Kategori", label: "Kategori" },
                { key: "Tipe", label: "Tipe" },
                { key: "Jumlah", label: "Jumlah (Rp)" },
              ]);
              toast.success("Data keuangan diexport ke CSV");
            }}
          >
            <Download size={14} />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={15} className="mr-1" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 stagger">
        {/* Saldo Kas */}
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-green-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <Wallet size={18} className="text-accent" />
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
          style={{ animationDelay: "40ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]">
            <TrendingUp size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              Pemasukan Bulan Ini
              <ArrowUpRight size={12} className="text-accent" />
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

      {/* Daily Reconciliation Card */}
      <Card
        className="p-4 md:p-5 animate-fade-up relative"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_12px_-4px_rgba(245,158,11,0.25)]">
              <Scale size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
                Rekonsiliasi Harian
              </h2>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                {todayReconciliationLog && (
                  <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 ml-1 bg-green-500/10 text-green-500 border-green-500/20">Selesai</Badge>
                )}
              </p>
            </div>
          </div>

          <Button size="sm" variant={todayReconciliationLog ? "outline" : "default"} onClick={() => setReconDialogOpen(true)}>
            {todayReconciliationLog ? "Edit Rekonsiliasi" : "Tutup Kasir"}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Opening Balance */}
          <div className="rounded-xl bg-surface border border-border p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Saldo Awal
            </p>
            <p className="text-sm md:text-base font-bold font-num text-foreground">
              {formatRupiah(openingBalance)}
            </p>
          </div>

          {/* Cash In */}
          <div className="rounded-xl bg-accent/[0.04] border border-accent-500/[0.08] p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-accent/80 uppercase tracking-wider mb-1">
              Kas Masuk
            </p>
            <p className="text-sm md:text-base font-bold font-num text-accent">
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
          <div className="rounded-xl bg-surface border border-border p-3 backdrop-blur-sm">
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Saldo Penutup
            </p>
            <p className="text-sm md:text-base font-bold font-num text-foreground">
              {formatRupiah(expectedClosing)}
            </p>
          </div>
        </div>
      </Card>

      {/* Recurring Expenses Panel */}
      {recurringExpenses.length > 0 && (
        <Card
          className="p-4 md:p-5 animate-fade-up"
          style={{ animationDelay: "280ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_12px_-4px_rgba(99,102,241,0.25)]">
                <RefreshCw size={16} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
                Pengeluaran Berulang
              </h2>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRecurringDialogOpen(true)}>
              <Plus size={14} className="mr-1" />
              Tambah
            </Button>
          </div>

          <div className="space-y-2">
            {recurringExpenses.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">{rec.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rec.category} &bull; {frequencyLabel[rec.frequency] || rec.frequency} &bull; Berikut: {rec.nextDueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-num text-rose-400">
                    -{formatRupiah(rec.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRecurring(rec.id)}
                    className="h-7 w-7 p-0 text-muted-dim hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transaction Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Kategori
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Oleh
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
                  className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
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
                  <td className="px-3 md:px-4 py-3 text-[10px] text-muted-dim hidden lg:table-cell">
                    {txn.employee?.name || txn.createdByUser?.name || "Sistem"}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold font-num text-right whitespace-nowrap">
                    <span
                      className={
                        txn.type === "pemasukan"
                          ? "text-accent"
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



      {/* Action Buttons: Category Management + Recurring */}
      <div className="flex gap-2 justify-end animate-fade-up flex-wrap" style={{ animationDelay: "300ms" }}>
        <Button size="sm" variant="ghost" onClick={() => setCategoryDialogOpen(true)}>
          <Settings2 size={14} className="mr-1" />
          Kelola Kategori
        </Button>
        {recurringExpenses.length === 0 && (
          <Button size="sm" variant="ghost" onClick={() => setRecurringDialogOpen(true)}>
            <RefreshCw size={14} className="mr-1" />
            Pengeluaran Berulang
          </Button>
        )}
      </div>

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

          {/* Lampiran URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Paperclip size={12} />
              Link Bukti / Nota (opsional)
            </label>
            <Input
              placeholder="https://drive.google.com/... atau URL gambar nota"
              value={form.attachmentUrl}
              onChange={(e) => updateForm("attachmentUrl", e.target.value)}
              icon={<Link2 size={14} />}
            />
          </div>

          {/* Preview */}
          {form.amount && (
            <div className="flex justify-between items-center px-1 py-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Jumlah Transaksi
              </span>
              <span
                className={`text-sm font-bold font-num ${form.type === "pemasukan"
                  ? "text-accent"
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

      {/* ================================================================= */}
      {/* Category Management Dialog                                         */}
      {/* ================================================================= */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        className="max-w-sm"
      >
        <DialogClose onClose={() => setCategoryDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 size={16} className="text-accent" />
            Kelola Kategori
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Categories */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={cat.type === "pemasukan" ? "success" : "destructive"} className="text-[9px]">
                    {cat.type === "pemasukan" ? "Masuk" : "Keluar"}
                  </Badge>
                  <span className="text-xs font-medium text-foreground">{cat.name}</span>
                </div>
                {!cat.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="h-6 w-6 p-0 text-muted-dim hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Category */}
          <form onSubmit={handleAddCategory} className="space-y-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground font-medium">Tambah Kategori Baru</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nama kategori..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Select
                options={[
                  { label: "Keluar", value: "keluar" },
                  { label: "Masuk", value: "masuk" },
                ]}
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value as "masuk" | "keluar")}
              />
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={!newCategoryName.trim()}>
              <Plus size={14} className="mr-1" />
              Tambah Kategori
            </Button>
          </form>
        </div>
      </Dialog>

      {/* ================================================================= */}
      {/* Add Recurring Expense Dialog                                       */}
      {/* ================================================================= */}
      <Dialog
        open={recurringDialogOpen}
        onClose={() => setRecurringDialogOpen(false)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setRecurringDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw size={16} className="text-accent" />
            Pengeluaran Berulang Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddRecurring} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
            <Input
              placeholder="Contoh: Sewa bulanan gedung"
              value={recurringForm.description}
              onChange={(e) => setRecurringForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Kategori</label>
            <Select
              options={categoryOptions}
              placeholder="Pilih kategori"
              value={recurringForm.category}
              onChange={(e) => setRecurringForm((p) => ({ ...p, category: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Jumlah (Rp)</label>
            <Input
              type="number"
              placeholder="0"
              value={recurringForm.amount}
              onChange={(e) => setRecurringForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Frekuensi</label>
            <Select
              options={frequencyOptions}
              value={recurringForm.frequency}
              onChange={(e) => setRecurringForm((p) => ({ ...p, frequency: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mulai Tanggal</label>
            <Input
              type="date"
              value={recurringForm.nextDueDate}
              onChange={(e) => setRecurringForm((p) => ({ ...p, nextDueDate: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setRecurringDialogOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!recurringForm.description || !recurringForm.amount}>
              <Plus size={15} />
              Simpan
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
