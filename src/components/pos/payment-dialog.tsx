"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatRupiah } from "@/lib/utils";
import { Banknote, CreditCard, Smartphone, Check, QrCode, Building2, Wallet, Printer, MessageCircle } from "lucide-react";
import { useState } from "react";

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

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  onConfirm: (paymentMethod: PaymentMethod) => void;
}

export function PaymentDialog({
  open,
  onClose,
  total,
  subtotal,
  tax,
  shippingFee,
  onConfirm,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("tunai");
  const [cashAmount, setCashAmount] = useState("");
  const [paid, setPaid] = useState(false);
  const [selectedEwallet, setSelectedEwallet] = useState("GoPay");

  const cashNum = parseInt(cashAmount) || 0;
  const change = cashNum - total;

  const handleConfirm = () => {
    const selectedMethod = method;
    setPaid(true);
    setTimeout(() => {
      setPaid(false);
      setCashAmount("");
      setMethod("tunai");
      onConfirm(selectedMethod);
    }, 1500);
  };

  const handleClose = () => {
    setPaid(false);
    setCashAmount("");
    setMethod("tunai");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-md">
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>Pembayaran</DialogTitle>
      </DialogHeader>

      {paid ? (
        <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/15 flex items-center justify-center mb-4 shadow-[0_0_40px_-5px_rgba(16,185,129,0.3)] backdrop-blur-sm">
            <Check size={32} className="text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <p className="text-lg font-bold text-foreground font-[family-name:var(--font-display)]">
            Pembayaran Berhasil!
          </p>
          {method === "tunai" && change > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Kembalian:{" "}
              <span className="font-num font-bold text-success">
                {formatRupiah(change)}
              </span>
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="sm">
              <Printer size={14} />
              Cetak Struk
            </Button>
            <Button variant="secondary" size="sm">
              <MessageCircle size={14} />
              Kirim WhatsApp
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Total with breakdown */}
          <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">
              Total Pembayaran
            </p>
            <p className="text-3xl font-bold font-num text-gradient">
              {formatRupiah(total)}
            </p>
            <div className="flex justify-center gap-3 mt-2 text-[10px] text-muted-dim">
              <span>Subtotal: {formatRupiah(subtotal)}</span>
              <span>PPN: {formatRupiah(tax)}</span>
              {shippingFee > 0 && <span>Ongkir: {formatRupiah(shippingFee)}</span>}
            </div>
          </div>

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
                  <span className="text-foreground">Hijab & Fashion Store</span>
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

          {/* Confirm */}
          <Button
            onClick={handleConfirm}
            disabled={method === "tunai" && cashNum < total}
            className="w-full h-11 text-sm font-bold"
          >
            Konfirmasi Pembayaran
          </Button>
        </div>
      )}
    </Dialog>
  );
}
