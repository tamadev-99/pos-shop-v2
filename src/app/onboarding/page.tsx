"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Store,
  ShoppingBag,
  MapPin,
  ArrowRight,
  Shield,
  Check,
  Loader2,
  User,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createStoreAction } from "./actions";

type StoreType = "clothing" | "minimart";

const storeTypes: {
  type: StoreType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  features: string[];
}[] = [
  {
    type: "clothing",
    label: "Clothing Store",
    desc: "Toko pakaian, fashion, dan aksesori",
    icon: <ShoppingBag size={28} />,
    gradient: "from-violet-500/20 to-purple-500/20",
    accentColor: "border-violet-500/50 shadow-violet-500/10",
    features: ["Manajemen variasi (ukuran & warna)", "Barcode produk", "Laporan penjualan per kategori"],
  },
  {
    type: "minimart",
    label: "Mini Mart",
    desc: "Minimarket, sembako, dan kebutuhan sehari-hari",
    icon: <Store size={28} />,
    gradient: "from-cyan-500/20 to-emerald-500/20",
    accentColor: "border-cyan-500/50 shadow-cyan-500/10",
    features: ["Scan barcode cepat", "Manajemen expiry date", "Stok batch per supplier"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<StoreType | null>(null);
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPin, setOwnerPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNextStep = () => {
    if (!selectedType) {
      toast.error("Pilih jenis toko terlebih dahulu.");
      return;
    }
    if (!storeName.trim()) {
      toast.error("Masukkan nama toko.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      toast.error("Masukkan nama profil Anda.");
      return;
    }
    if (ownerPin.length !== 6 || !/^\d{6}$/.test(ownerPin)) {
      toast.error("PIN harus 6 digit angka.");
      return;
    }
    if (ownerPin !== confirmPin) {
      toast.error("PIN tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await createStoreAction(
        storeName.trim(),
        selectedType!,
        address.trim() || undefined,
        ownerName.trim(),
        ownerPin,
      );

      if (res.success) {
        toast.success("Berhasil membuat toko baru!");
        router.push("/select-store");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal membuat toko");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background py-12 px-4">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "-10%", right: "5%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", bottom: "0%", left: "0%" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-fade-up">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mb-4 shadow-lg shadow-violet-500/20">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-gradient">Setup Toko Anda</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {step === 1 ? "Langkah 1 dari 2 — Informasi Toko" : "Langkah 2 dari 2 — Profil Owner & PIN"}
          </p>

          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  s === step ? "w-16" : "w-8",
                  s <= step ? "bg-accent" : "bg-border"
                )}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-card border border-border p-7 shadow-[var(--shadow-lg)]">

          {/* ───────── STEP 1: Store Info ───────── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Store type selector */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">
                  Pilih Jenis Toko <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {storeTypes.map(({ type, label, desc, icon, gradient, accentColor, features }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "relative text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg cursor-pointer",
                        selectedType === type
                          ? `${accentColor} shadow-lg bg-gradient-to-br ${gradient} border-2`
                          : "border-border hover:border-border/80 bg-surface"
                      )}
                    >
                      {selectedType === type && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                        `bg-gradient-to-br ${gradient}`,
                        selectedType === type ? "text-accent" : "text-muted-foreground"
                      )}>
                        {icon}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-3">{desc}</p>
                      <ul className="space-y-1">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Check size={10} className="text-accent shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {selectedType === type && (
                        <p className="text-[10px] text-amber-400 mt-3 font-medium">
                          ⚠ Tidak dapat diubah setelah toko dibuat
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Store name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="cth. Toko Baju Maju, Minimart Sejahtera"
                    className="pl-10"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Alamat <span className="text-muted-dim text-[11px]">(opsional)</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                    className="pl-10"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-11 text-sm font-semibold"
                disabled={!selectedType || !storeName.trim()}
              >
                Lanjut ke Profil Owner
                <ArrowRight size={15} className="ml-2" />
              </Button>
            </div>
          )}

          {/* ───────── STEP 2: Owner Profile & PIN ───────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info banner */}
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3.5 flex items-start gap-3">
                <Shield size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-violet-300">Profil Owner</p>
                  <p className="text-[11px] text-violet-300/80 mt-0.5 leading-relaxed">
                    Profil ini akan digunakan untuk masuk ke sistem POS setiap hari. Semua transaksi akan direkam berdasarkan profil aktif.
                  </p>
                </div>
              </div>

              {/* Owner name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nama Profil <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="cth. Budi Santoso (Owner)"
                    className="pl-10"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  PIN 6 Digit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Masukkan 6 digit angka"
                    className="pl-10 tracking-[0.4em] font-mono"
                    value={ownerPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOwnerPin(val);
                    }}
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-dim">PIN digunakan untuk masuk ke sistem POS</p>
              </div>

              {/* Confirm PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Konfirmasi PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Ulangi PIN"
                    className="pl-10 tracking-[0.4em] font-mono"
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setConfirmPin(val);
                    }}
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              {/* PIN match indicator */}
              {ownerPin.length === 6 && confirmPin.length === 6 && (
                <div className={cn(
                  "rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] font-medium",
                  ownerPin === confirmPin
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                )}>
                  <Check size={12} />
                  {ownerPin === confirmPin ? "PIN cocok!" : "PIN tidak cocok"}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11"
                  disabled={loading}
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  className="flex-2 h-11 text-sm font-semibold"
                  disabled={loading || !ownerName || ownerPin.length !== 6 || ownerPin !== confirmPin}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Membuat Toko...
                    </>
                  ) : (
                    <>
                      Selesai & Buka Toko
                      <ArrowRight size={15} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-dim mt-6">
          &copy; 2026 KasirPro. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
