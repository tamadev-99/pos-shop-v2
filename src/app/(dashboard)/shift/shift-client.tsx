"use client";

import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
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
import { cn, formatRupiah, formatNumber } from "@/lib/utils";
import {
  Clock,
  Play,
  Square,
  AlertTriangle,
  DollarSign,
  User,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { openShift, closeShift, getShiftHistory } from "@/lib/actions/shifts";
import { useAuth } from "@/components/providers/auth-provider";

interface ShiftData {
  id: string;
  storeId: string;
  employeeProfileId: string;
  employee?: { name: string } | null;
  openedAt: Date;
  closedAt: Date | null;
  openingBalance: number;
  expectedClosing: number | null;
  actualClosing: number | null;
  difference: number | null;
  totalSales: number | null;
  totalCashSales: number | null;
  totalNonCashSales: number | null;
  totalTransactions: number | null;
  status: "active" | "closed";
  notes: string | null;
}

interface Props {
  initialActiveShifts: ShiftData[];
  initialShiftHistory: ShiftData[];
  totalShifts: number;
  users: { id: string; name: string }[];
}

export default function ShiftClient({ initialActiveShifts, initialShiftHistory, totalShifts, users }: Props) {
  const { user, activeEmployeeName, activeEmployeeProfileId } = useAuth();

  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [actualBalance, setActualBalance] = useState("");
  const [openingBalanceInput, setOpeningBalanceInput] = useState("500000");
  const [closeNotes, setCloseNotes] = useState("");
  const [openNotes, setOpenNotes] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Pagination state
  const [shiftHistory, setShiftHistory] = useState<ShiftData[]>(initialShiftHistory);

  // Sync state when props change from router.refresh()
  useEffect(() => {
    setShiftHistory(initialShiftHistory);
  }, [initialShiftHistory]);

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMorePages = shiftHistory.length < totalShifts;

  const loadMoreShifts = async () => {
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getShiftHistory(nextPage, 20);
      setShiftHistory((prev) => [...prev, ...(result.data as ShiftData[])]);
      setCurrentPage(nextPage);
    } catch {
      toast.error("Gagal memuat data shift");
    } finally {
      setLoadingMore(false);
    }
  };

  const [isPending, startTransition] = useTransition();

  // Find shift for current user (profile-based)
  const activeShift = activeEmployeeProfileId && initialActiveShifts.length > 0
    ? initialActiveShifts.find((s) => s.employeeProfileId === activeEmployeeProfileId)
    : initialActiveShifts[0];

  const estimatedCashIn = activeShift?.totalCashSales || 0;
  const estimatedNonCashIn = activeShift?.totalNonCashSales || 0;
  const estimatedExpected = activeShift
    ? activeShift.openingBalance + estimatedCashIn
    : 0;
  const selisih = actualBalance
    ? Number(actualBalance) - estimatedExpected
    : 0;

  // Check if active shift is from a previous day
  const isPreviousDayShift = (() => {
    if (!activeShift) return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(activeShift.openedAt) < startOfToday;
  })();

  const cashierOptions = users.map(u => ({ label: u.name, value: u.id }));

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployeeProfileId || !openingBalanceInput) return;
    startTransition(async () => {
      const res = await openShift(Number(openingBalanceInput));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Shift berhasil dibuka!");
      setOpenShiftDialog(false);
      setOpeningBalanceInput("500000");
      setOpenNotes("");
      router.refresh();
    });
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !actualBalance) return;
    startTransition(async () => {
      await closeShift(activeShift.id, Number(actualBalance), closeNotes);
      toast.success("Shift berhasil ditutup!");
      setCloseShiftDialog(false);
      setActualBalance("");
      setCloseNotes("");
      router.refresh();
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Manajemen Shift
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola shift kasir dan rekonsiliasi saldo
          </p>
        </div>
        <div className="flex gap-2">
          {!activeShift && (
            <Button onClick={() => setOpenShiftDialog(true)}>
              <Play size={15} />
              Buka Shift
            </Button>
          )}
          {activeShift && (
            <Button
              variant="destructive"
              onClick={() => setCloseShiftDialog(true)}
            >
              <Square size={15} />
              Tutup Shift
            </Button>
          )}
        </div>
      </div>

      {/* Active Shift Status Card */}
      <Card
        className={cn(
          "p-4 md:p-5 animate-fade-up",
          isPreviousDayShift && activeShift ? "border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)] bg-amber-500/5" : ""
        )}
        hover
        style={{ animationDelay: "60ms" }}
      >
        {activeShift ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isPreviousDayShift
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]"
                : "bg-gradient-to-br from-violet-500/20 to-cyan-500/20 shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]"
            )}>
              {isPreviousDayShift ? (
                <AlertTriangle size={22} className="text-amber-400" />
              ) : (
                <Clock size={22} className="text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {isPreviousDayShift ? "Shift Belum Ditutup (Kemarin)" : "Shift Aktif"}
                </h3>
                {isPreviousDayShift ? (
                  <Badge variant="destructive" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/30">Harus Ditutup</Badge>
                ) : (
                  <Badge variant="success">Berjalan</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kasir:{" "}
                <span className="text-foreground font-medium">
                  {activeShift.employee?.name || "Kasir"}
                </span>
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Saldo Awal
                  </p>
                  <p className="text-xs font-bold font-num text-foreground">
                    {formatRupiah(activeShift.openingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Jam Buka
                  </p>
                  <p className="text-xs font-bold font-num text-foreground">
                    {formatTime(activeShift.openedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Tanggal
                  </p>
                  <p className="text-xs font-bold font-num text-foreground">
                    {formatDate(activeShift.openedAt)}
                  </p>
                </div>
              </div>
              {isPreviousDayShift && (
                <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Terdapat shift dari hari sebelumnya yang belum ditutup. Harap tutup shift ini untuk memulai transaksi di hari yang baru.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
              <AlertTriangle size={22} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Tidak ada shift aktif
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Buka shift terlebih dahulu untuk memulai transaksi kasir
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            <Clock size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Shift
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(totalShifts)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "180ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <DollarSign size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Shift Seimbang
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(
                shiftHistory.filter(
                  (s) => s.status === "closed" && s.difference === 0
                ).length
              )}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "240ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Selisih Negatif
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(
                shiftHistory.filter(
                  (s) => s.status === "closed" && !!s.difference && s.difference < 0
                ).length
              )}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          style={{ animationDelay: "300ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(59,130,246,0.25)]">
            <User size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Kasir
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(
                new Set(shiftHistory.map((s) => s.employeeProfileId)).size
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Shift History Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "360ms" }}
      >
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            Riwayat Shift
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Kasir
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Jam Buka
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Jam Tutup
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Saldo Awal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Saldo Akhir
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Selisih
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {shiftHistory.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-foreground">
                    {formatDate(shift.openedAt)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-border">
                        <User size={12} className="text-muted-dim" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {shift.employee?.name || "Sistem"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground">
                    {formatTime(shift.openedAt)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground hidden sm:table-cell">
                    {formatTime(shift.closedAt)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground hidden md:table-cell">
                    {formatRupiah(shift.openingBalance)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold font-num text-foreground">
                    {shift.status === "active"
                      ? "-"
                      : formatRupiah(shift.actualClosing || 0)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    {shift.status === "active" || shift.difference == null ? (
                      <span className="text-xs text-muted-dim">-</span>
                    ) : (
                      <span
                        className={`text-xs font-bold font-num ${shift.difference > 0
                          ? "text-accent"
                          : shift.difference < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                          }`}
                      >
                        {shift.difference > 0 ? "+" : ""}
                        {formatRupiah(shift.difference)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge
                      variant={
                        shift.status === "active" ? "success" : "default"
                      }
                    >
                      {shift.status === "active" ? "Aktif" : "Selesai"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Load More Pagination */}
      {hasMorePages && (
        <div className="flex justify-center animate-fade-up">
          <Button
            variant="ghost"
            onClick={loadMoreShifts}
            disabled={loadingMore}
            className="text-xs"
          >
            {loadingMore ? "Memuat..." : `Muat Lebih Banyak (${shiftHistory.length} dari ${totalShifts})`}
          </Button>
        </div>
      )}

      {/* Open Shift Dialog */}
      <Dialog
        open={openShiftDialog}
        onClose={() => setOpenShiftDialog(false)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setOpenShiftDialog(false)} />
        <DialogHeader>
          <DialogTitle>Buka Shift Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Kasir
            </label>
            <Input disabled value={activeEmployeeName || user?.name || "Memuat..."} />
            <p className="text-[10px] text-muted-dim">
              Shift akan dibuka untuk akun Anda saat ini
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Saldo Awal
            </label>
            <Input
              type="number"
              placeholder="500000"
              value={openingBalanceInput}
              onChange={(e) => setOpeningBalanceInput(e.target.value)}
            />
            <p className="text-[10px] text-muted-dim">
              Jumlah uang tunai di laci kasir saat shift dibuka
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Catatan
            </label>
            <Input
              placeholder="Catatan shift (opsional)"
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenShiftDialog(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending || !user?.id || !openingBalanceInput}>
              <Play size={14} />
              Buka Shift
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog
        open={closeShiftDialog}
        onClose={() => setCloseShiftDialog(false)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setCloseShiftDialog(false)} />
        <DialogHeader>
          <DialogTitle>Tutup Shift</DialogTitle>
        </DialogHeader>

        {activeShift && (
          <form onSubmit={handleCloseShift} className="space-y-4">
            {isPreviousDayShift && (
              <div className="mb-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Peringatan:</strong> Anda sedang menutup shift dari hari sebelumnya. Pastikan nominal akhir sesuai dengan uang di laci kemarin.
                </p>
              </div>
            )}

            {/* Shift Summary */}
            <div className="rounded-xl bg-surface border border-border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Ringkasan Shift
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Kasir
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {activeShift.employee?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Jam Buka
                  </p>
                  <p className="text-xs font-num text-foreground mt-0.5">
                    {formatTime(activeShift.openedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Saldo Awal
                  </p>
                  <p className="text-xs font-bold font-num text-foreground mt-0.5">
                    {formatRupiah(activeShift.openingBalance)}
                  </p>
                </div>

                <div className="col-span-2 md:col-span-3 border-t border-border pt-2 mt-1" />

                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Total Transaksi
                  </p>
                  <p className="text-xs font-bold font-num text-foreground mt-0.5">
                    {formatNumber(activeShift.totalTransactions || 0)} transaksi
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Total Semua Penjualan
                  </p>
                  <p className="text-xs font-bold font-num text-foreground mt-0.5">
                    {formatRupiah((activeShift.totalSales || 0))}
                  </p>
                </div>

                <div className="col-span-2 md:col-span-3 border-t border-border pt-2 mt-1" />

                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Penjualan Tunai (Cash)
                  </p>
                  <p className="text-xs font-bold font-num text-accent mt-0.5">
                    +{formatRupiah(estimatedCashIn)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Penjualan Non-Tunai
                  </p>
                  <p className="text-xs font-medium font-num text-blue-400 mt-0.5">
                    {formatRupiah(estimatedNonCashIn)}
                  </p>
                  <p className="text-[9px] text-muted-dim mt-0.5">
                    (Debit/QRIS/Transfer — tidak di laci)
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                      Saldo Diharapkan (di Laci)
                    </p>
                    <p className="text-[9px] text-muted-dim mt-0.5">
                      = Saldo Awal + Tunai
                    </p>
                  </div>
                  <p className="text-sm font-bold font-num text-foreground">
                    {formatRupiah(estimatedExpected)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Saldo Aktual (Uang Tunai di Laci)
              </label>
              <Input
                type="number"
                placeholder="Hitung uang tunai di laci kasir"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
              />
              <p className="text-[10px] text-muted-dim">
                Hanya hitung uang tunai (cash) di laci, tidak termasuk pembayaran debit/QRIS/transfer
              </p>
            </div>

            {/* Auto-calculated difference */}
            {actualBalance && (
              <div className="rounded-xl bg-surface border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selisih
                  </p>
                  <p
                    className={`text-sm font-bold font-num ${selisih >= 0 ? "text-accent" : "text-red-400"
                      }`}
                  >
                    {selisih > 0 ? "+" : ""}
                    {formatRupiah(selisih)}
                  </p>
                </div>
                {selisih < 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <p className="text-[10px] text-amber-400">
                      Saldo aktual kurang dari yang diharapkan
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Catatan
              </label>
              <Input
                placeholder="Catatan penutupan shift (opsional)"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCloseShiftDialog(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending || !actualBalance}>
                <Square size={14} />
                Tutup Shift
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
