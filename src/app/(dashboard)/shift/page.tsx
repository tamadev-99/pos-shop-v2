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
import { formatRupiah, formatNumber } from "@/lib/utils";
import {
  Clock,
  Play,
  Square,
  AlertTriangle,
  DollarSign,
  User,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockShifts = [
  {
    id: "SH-001",
    kasir: "Ahmad Rizky",
    date: "2026-02-28",
    openTime: "08:00",
    closeTime: "16:00",
    openingBalance: 500000,
    closingBalance: 4850000,
    expectedBalance: 4900000,
    difference: -50000,
    status: "selesai" as const,
  },
  {
    id: "SH-002",
    kasir: "Siti Nurhaliza",
    date: "2026-02-28",
    openTime: "16:00",
    closeTime: "22:00",
    openingBalance: 500000,
    closingBalance: 3200000,
    expectedBalance: 3200000,
    difference: 0,
    status: "selesai" as const,
  },
  {
    id: "SH-003",
    kasir: "Ahmad Rizky",
    date: "2026-02-27",
    openTime: "08:00",
    closeTime: "16:00",
    openingBalance: 500000,
    closingBalance: 5100000,
    expectedBalance: 5050000,
    difference: 50000,
    status: "selesai" as const,
  },
  {
    id: "SH-004",
    kasir: "Dewi Lestari",
    date: "2026-02-27",
    openTime: "16:00",
    closeTime: "22:00",
    openingBalance: 500000,
    closingBalance: 2800000,
    expectedBalance: 2850000,
    difference: -50000,
    status: "selesai" as const,
  },
  {
    id: "SH-005",
    kasir: "Ahmad Rizky",
    date: "2026-02-26",
    openTime: "08:00",
    closeTime: "16:00",
    openingBalance: 500000,
    closingBalance: 4200000,
    expectedBalance: 4200000,
    difference: 0,
    status: "selesai" as const,
  },
  {
    id: "SH-006",
    kasir: "Siti Nurhaliza",
    date: "2026-02-26",
    openTime: "16:00",
    closeTime: "-",
    openingBalance: 500000,
    closingBalance: 0,
    expectedBalance: 0,
    difference: 0,
    status: "aktif" as const,
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ShiftPage() {
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [actualBalance, setActualBalance] = useState("");
  const [openingBalanceInput, setOpeningBalanceInput] = useState("500000");

  const activeShift = mockShifts.find((s) => s.status === "aktif");

  // Estimated values for closing dialog
  const estimatedCashIn = 2700000;
  const estimatedExpected = activeShift
    ? activeShift.openingBalance + estimatedCashIn
    : 0;
  const selisih = actualBalance
    ? Number(actualBalance) - estimatedExpected
    : 0;

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
            <>
              <Button
                variant="ghost"
                onClick={() => setOpenShiftDialog(true)}
              >
                <Play size={15} />
                Buka Shift
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCloseShiftDialog(true)}
              >
                <Square size={15} />
                Tutup Shift
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active Shift Status Card */}
      <Card
        className="p-4 md:p-5 animate-fade-up"
        hover
        glow={activeShift ? "success" : undefined}
        style={{ animationDelay: "60ms" }}
      >
        {activeShift ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
              <Clock size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Shift Aktif
                </h3>
                <Badge variant="success">Berjalan</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kasir:{" "}
                <span className="text-foreground font-medium">
                  {activeShift.kasir}
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
                    {activeShift.openTime}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Tanggal
                  </p>
                  <p className="text-xs font-bold font-num text-foreground">
                    {activeShift.date}
                  </p>
                </div>
              </div>
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
            <Button onClick={() => setOpenShiftDialog(true)}>
              <Play size={15} />
              Buka Shift
            </Button>
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
              {formatNumber(mockShifts.length)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="success"
          style={{ animationDelay: "180ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Shift Seimbang
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(
                mockShifts.filter(
                  (s) => s.status === "selesai" && s.difference === 0
                ).length
              )}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="warning"
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
                mockShifts.filter(
                  (s) => s.status === "selesai" && s.difference < 0
                ).length
              )}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="accent"
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
                new Set(mockShifts.map((s) => s.kasir)).size
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
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            Riwayat Shift
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
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
              {mockShifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-foreground">
                    {shift.date}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-white/[0.04]">
                        <User size={12} className="text-muted-dim" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {shift.kasir}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground">
                    {shift.openTime}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground hidden sm:table-cell">
                    {shift.closeTime}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-muted-foreground hidden md:table-cell">
                    {formatRupiah(shift.openingBalance)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold font-num text-foreground">
                    {shift.status === "aktif"
                      ? "-"
                      : formatRupiah(shift.closingBalance)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    {shift.status === "aktif" ? (
                      <span className="text-xs text-muted-dim">-</span>
                    ) : (
                      <span
                        className={`text-xs font-bold font-num ${
                          shift.difference > 0
                            ? "text-emerald-400"
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
                        shift.status === "aktif" ? "success" : "default"
                      }
                    >
                      {shift.status === "aktif" ? "Aktif" : "Selesai"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpenShiftDialog(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Kasir
            </label>
            <Select
              placeholder="Pilih kasir"
              options={[
                { label: "Ahmad Rizky", value: "Ahmad Rizky" },
                { label: "Siti Nurhaliza", value: "Siti Nurhaliza" },
                { label: "Dewi Lestari", value: "Dewi Lestari" },
              ]}
              defaultValue=""
            />
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
            <Input placeholder="Catatan shift (opsional)" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenShiftDialog(false)}
            >
              Batal
            </Button>
            <Button type="submit">
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCloseShiftDialog(false);
            }}
            className="space-y-4"
          >
            {/* Shift Summary */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Ringkasan Shift
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Kasir
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {activeShift.kasir}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Jam Buka
                  </p>
                  <p className="text-xs font-num text-foreground mt-0.5">
                    {activeShift.openTime}
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
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Estimasi Kas Masuk
                  </p>
                  <p className="text-xs font-bold font-num text-emerald-400 mt-0.5">
                    +{formatRupiah(estimatedCashIn)}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Saldo Diharapkan
                  </p>
                  <p className="text-sm font-bold font-num text-foreground">
                    {formatRupiah(estimatedExpected)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Saldo Aktual
              </label>
              <Input
                type="number"
                placeholder="Masukkan jumlah uang di laci"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
              />
            </div>

            {/* Auto-calculated difference */}
            {actualBalance && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selisih
                  </p>
                  <p
                    className={`text-sm font-bold font-num ${
                      selisih >= 0 ? "text-emerald-400" : "text-red-400"
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
              <Input placeholder="Catatan penutupan shift (opsional)" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCloseShiftDialog(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive">
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
