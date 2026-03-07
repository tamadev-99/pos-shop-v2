"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatRupiah } from "@/lib/utils";
import { Banknote, CreditCard, Check, QrCode, Building2, Wallet, Printer, MessageCircle, Loader2, Monitor, Split, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  buildReceiptCommands,
  printReceipt,
  printViaBrowser,
  type PrinterConfig,
  type ReceiptPrintData,
} from "@/lib/thermal-printer";

type PaymentMethod = "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet";

const methods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: "tunai", label: "Tunai", icon: Banknote },
  { id: "debit", label: "Debit", icon: CreditCard },
  { id: "kredit", label: "Kredit", icon: CreditCard },
  { id: "transfer", label: "Transfer", icon: Building2 },
  { id: "qris", label: "QRIS", icon: QrCode },
  { id: "ewallet", label: "E-Wallet", icon: Wallet },
];

const quickAmounts = [50000, 100000, 200000, 500000];

const ewalletOptions = ["GoPay", "OVO", "DANA", "ShopeePay"];

const paymentMethodLabels: Record<string, string> = {
  tunai: "Tunai",
  debit: "Debit",
  kredit: "Kredit",
  transfer: "Transfer",
  qris: "QRIS",
  ewallet: "E-Wallet",
};

interface ReceiptData {
  items: { name: string; qty: number; price: number }[];
  customerName: string;
  subtotal: number;
  discountAmount: number;
  tax: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptHeader: string;
  receiptFooter: string;
}

// Split payment entry
interface SplitEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount?: number;
  taxMode?: string;
  taxName?: string;
  onConfirm: (paymentMethod: PaymentMethod, cashPaid?: number, changeAmount?: number, splitNote?: string) => Promise<void> | void;
}

export function PaymentDialog({
  open,
  onClose,
  total,
  subtotal,
  tax,
  shippingFee,
  discountAmount = 0,
  taxMode = "no",
  taxName = "PPN",
  onConfirm,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("tunai");
  const [cashAmount, setCashAmount] = useState("");
  const [selectedEwallet, setSelectedEwallet] = useState("GoPay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split payment state
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [splitMethod, setSplitMethod] = useState<PaymentMethod>("tunai");
  const [splitAmount, setSplitAmount] = useState("");

  const cashNum = parseInt(cashAmount) || 0;
  const change = cashNum - total;

  // Split calculations
  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const splitRemaining = total - splitTotal;

  const addSplit = () => {
    const amt = parseInt(splitAmount) || 0;
    if (amt <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }
    if (amt > splitRemaining) {
      toast.error(`Jumlah melebihi sisa (${formatRupiah(splitRemaining)})`);
      return;
    }
    setSplits(prev => [...prev, {
      id: crypto.randomUUID(),
      method: splitMethod,
      amount: amt,
    }]);
    setSplitAmount("");
  };

  const removeSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const fillSplitRemaining = () => {
    setSplitAmount(String(splitRemaining));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      if (isSplit) {
        // Use first split's method as primary, put full details in splitNote
        const primaryMethod = splits[0]?.method || "tunai";
        const splitNote = "Split: " + splits.map(s =>
          `${paymentMethodLabels[s.method]} ${formatRupiah(s.amount)}`
        ).join(" + ");
        await onConfirm(primaryMethod, undefined, undefined, splitNote);
      } else {
        await onConfirm(
          method,
          method === "tunai" ? cashNum : undefined,
          method === "tunai" && change > 0 ? change : undefined
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCashAmount("");
    setMethod("tunai");
    setIsSplit(false);
    setSplits([]);
    setSplitAmount("");
    onClose();
  };

  const canConfirmSingle = method === "tunai" ? cashNum >= total : true;
  const canConfirmSplit = splitTotal >= total;

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-md">
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>Pembayaran</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 mt-2">
        {/* Total with breakdown */}
        <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">
            Total Pembayaran
          </p>
          <p className="text-3xl font-bold font-num text-gradient">
            {formatRupiah(total)}
          </p>
          <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-dim flex-wrap">
            <span>Subtotal: {formatRupiah(subtotal)}</span>
            {discountAmount > 0 && <span className="text-rose-400">Diskon: -{formatRupiah(discountAmount)}</span>}
            {taxMode !== "no" && <span>{taxName} {taxMode === "include" ? "(Inc)" : ""}: {formatRupiah(tax)}</span>}
            {shippingFee > 0 && <span>Ongkir: {formatRupiah(shippingFee)}</span>}
          </div>
        </div>

        {/* Split Payment Toggle */}
        <button
          onClick={() => { setIsSplit(!isSplit); setSplits([]); setSplitAmount(""); }}
          className={cn(
            "w-full flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer",
            isSplit
              ? "border-violet-500/25 bg-violet-500/[0.08] text-violet-400"
              : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          )}
        >
          <Split size={14} />
          Split Payment {isSplit && "— Aktif"}
        </button>

        {/* ─── SPLIT PAYMENT MODE ─── */}
        {isSplit ? (
          <div className="space-y-3">
            {/* Existing splits */}
            {splits.length > 0 && (
              <div className="space-y-1.5">
                {splits.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{paymentMethodLabels[s.method]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-num font-semibold text-accent">{formatRupiah(s.amount)}</span>
                      <button
                        onClick={() => removeSplit(s.id)}
                        className="text-muted-dim hover:text-destructive transition-colors cursor-pointer p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Remaining display */}
            <div className={cn(
              "text-center py-2 rounded-xl border",
              splitRemaining <= 0 ? "border-accent/20 bg-accent/[0.06]" : "border-amber-500/20 bg-amber-500/[0.06]"
            )}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sisa</p>
              <p className={cn("text-lg font-bold font-num", splitRemaining <= 0 ? "text-accent" : "text-amber-400")}>
                {formatRupiah(Math.max(0, splitRemaining))}
              </p>
            </div>

            {/* Add split entry */}
            {splitRemaining > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Tambah Pembayaran</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSplitMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-2 transition-all cursor-pointer text-[10px] font-medium",
                        splitMethod === m.id
                          ? "border-accent/25 bg-accent/[0.08] text-accent"
                          : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      <m.icon size={14} />
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="flex-1 text-sm font-num h-10"
                  />
                  <Button variant="secondary" size="sm" className="h-10 px-3" onClick={fillSplitRemaining}>
                    Sisa
                  </Button>
                  <Button size="sm" className="h-10 px-3" onClick={addSplit}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── SINGLE PAYMENT MODE ─── */
          <>
            {/* Method */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2.5">
                Metode Pembayaran
              </p>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-300 cursor-pointer backdrop-blur-sm",
                      method === m.id
                        ? [
                          "border-accent/25 bg-accent/[0.08] text-accent",
                          "shadow-[0_0_24px_-6px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(16,185,129,0.1)]",
                        ]
                        : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] hover:border-white/[0.1]"
                    )}
                  >
                    <m.icon size={18} />
                    <span className="text-[10px] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash input */}
            {method === "tunai" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Jumlah Uang Diterima
                  </p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="text-center text-lg font-num font-bold h-12"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashAmount(String(amt))}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 text-xs font-num font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.07] hover:border-white/[0.1] transition-all cursor-pointer backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCashAmount(String(total))}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.07] hover:border-white/[0.1] transition-all cursor-pointer backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  Uang Pas — {formatRupiah(total)}
                </button>
                {cashNum > 0 && (
                  <div className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground">Kembalian</span>
                    <span
                      className={cn(
                        "text-sm font-num font-bold",
                        change >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {formatRupiah(Math.max(0, change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QRIS placeholder */}
            {method === "qris" && (
              <div className="flex flex-col items-center py-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-32 h-32 rounded-xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center mb-3">
                  <QrCode size={48} className="text-muted-dim/40" />
                </div>
                <p className="text-xs text-muted-foreground">Scan QR Code untuk membayar</p>
                <p className="text-[10px] text-muted-dim mt-1">QR akan tampil setelah integrasi payment gateway</p>
              </div>
            )}

            {/* Transfer placeholder */}
            {method === "transfer" && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Transfer ke rekening:</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="text-foreground font-medium">BCA</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">No. Rekening</span>
                    <span className="text-foreground font-num">1234567890</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Atas Nama</span>
                    <span className="text-foreground">Hijab &amp; Fashion Store</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-dim mt-2">Konfirmasi pembayaran setelah transfer berhasil</p>
              </div>
            )}

            {/* E-Wallet sub-options */}
            {method === "ewallet" && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Pilih E-Wallet</p>
                <div className="grid grid-cols-2 gap-2">
                  {ewalletOptions.map((ew) => (
                    <button
                      key={ew}
                      onClick={() => setSelectedEwallet(ew)}
                      className={cn(
                        "rounded-xl border p-2.5 text-xs font-medium transition-all cursor-pointer",
                        selectedEwallet === ew
                          ? "border-accent/25 bg-accent/[0.08] text-accent"
                          : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      {ew}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-dim">Pembayaran akan diproses melalui {selectedEwallet}</p>
              </div>
            )}
          </>
        )}

        {/* Confirm */}
        <Button
          onClick={handleConfirm}
          disabled={isSplit ? !canConfirmSplit || isSubmitting : !canConfirmSingle || isSubmitting}
          className="w-full h-11 text-sm font-bold"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSplit
            ? `Konfirmasi Split Payment (${splits.length} metode)`
            : "Konfirmasi Pembayaran"
          }
        </Button>
      </div>
    </Dialog>
  );
}
