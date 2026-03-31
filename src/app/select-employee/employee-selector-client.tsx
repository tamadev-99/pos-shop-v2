"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkles, Store, ArrowLeft, Delete, ShieldCheck, Loader2 } from "lucide-react";
import { verifyEmployeePIN } from "./actions";
import { switchStore } from "./actions";

interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  image: string | null;
}

interface Props {
  profiles: EmployeeProfile[];
  storeName: string;
  ownerName: string;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manajer",
  cashier: "Kasir",
};

const roleColors: Record<string, string> = {
  owner: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  manager: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cashier: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EmployeeSelectorClient({ profiles, storeName, ownerName }: Props) {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<EmployeeProfile | null>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [switchingStore, setSwitchingStore] = useState(false);
  const pinLength = 6;
  const attemptRef = useRef(0);

  // Handle keypress for PIN
  useEffect(() => {
    if (!selectedProfile) return;

    const handler = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key >= "0" && e.key <= "9") {
        setPin((prev) => (prev.length < pinLength ? prev + e.key : prev));
        setError(null);
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
        setError(null);
      } else if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedProfile, loading]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === pinLength && selectedProfile && !loading) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = useCallback(async () => {
    if (!selectedProfile || pin.length !== pinLength) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyEmployeePIN(selectedProfile.id, pin);

      if (result.success) {
        toast.success(`Selamat datang, ${result.employeeName}!`);
        router.push("/dashboard");
        router.refresh();
      } else {
        attemptRef.current++;
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
        setError(result.error || "PIN salah.");

        if (attemptRef.current >= 5) {
          setError("Terlalu banyak percobaan. Coba lagi nanti.");
          setTimeout(() => {
            attemptRef.current = 0;
            setError(null);
          }, 60000);
        }
      }
    } catch {
      setError("Terjadi kesalahan.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [selectedProfile, pin, router]);

  const handleBack = () => {
    setSelectedProfile(null);
    setPin("");
    setError(null);
    attemptRef.current = 0;
  };

  const handleNumpadPress = (num: string) => {
    if (loading || attemptRef.current >= 5) return;
    setPin((prev) => (prev.length < pinLength ? prev + num : prev));
    setError(null);
  };

  const handleDelete = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleSwitchStore = async () => {
    setSwitchingStore(true);
    await switchStore();
    router.push("/select-store");
    router.refresh();
  };

  // ─── PIN NUMPAD SCREEN ──────────────────────────────────
  if (selectedProfile) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        {/* Background ambient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[200px] opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "0", left: "30%" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center animate-fade-up">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-4 border border-violet-500/20 shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]">
            <span className="text-2xl font-bold text-violet-400">
              {getInitials(selectedProfile.name)}
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">{selectedProfile.name}</h2>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border mb-6",
              roleColors[selectedProfile.role] || roleColors["cashier"]
            )}
          >
            {roleLabels[selectedProfile.role] || selectedProfile.role}
          </span>

          <p className="text-xs text-muted-foreground mb-5">Masukkan PIN 6 digit</p>

          {/* PIN Dots */}
          <div className={cn("flex gap-3 mb-6", shake && "animate-shake")}>
            {Array.from({ length: pinLength }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full transition-all duration-200",
                  i < pin.length
                    ? "bg-accent scale-110 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : "bg-border"
                )}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-400 mb-4 animate-fade-up">{error}</p>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="mb-4">
              <Loader2 size={20} className="text-accent animate-spin" />
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-[260px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
              (key) => {
                if (key === "") return <div key="empty" />;
                if (key === "del") {
                  return (
                    <button
                      key="del"
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center justify-center h-16 rounded-2xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04] active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50"
                    >
                      <Delete size={20} />
                    </button>
                  );
                }
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    disabled={loading || attemptRef.current >= 5}
                    className="flex items-center justify-center h-16 rounded-2xl bg-surface border border-border text-xl font-semibold text-foreground hover:bg-white/[0.04] active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {key}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── EMPLOYEE SELECTION GRID ────────────────────────────
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden p-6">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "5%", right: "10%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", bottom: "5%", left: "10%" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-gradient">Siapa yang bertugas?</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Store size={14} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{storeName}</p>
          </div>
        </div>

        {/* Employee Grid */}
        {profiles.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 text-center">
            <ShieldCheck size={40} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada profil karyawan</h3>
            <p className="text-sm text-muted-foreground">
              Silakan tambahkan karyawan di halaman Manajemen Karyawan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className="group flex flex-col items-center p-5 rounded-2xl bg-card border border-border hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200 cursor-pointer active:scale-[0.97]"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-violet-500/10">
                  <span className="text-lg font-bold text-violet-400">
                    {getInitials(profile.name)}
                  </span>
                </div>

                {/* Name */}
                <p className="text-sm font-semibold text-foreground text-center truncate w-full group-hover:text-accent transition-colors">
                  {profile.name}
                </p>

                {/* Role Badge */}
                <span
                  className={cn(
                    "mt-1.5 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
                    roleColors[profile.role] || roleColors["cashier"]
                  )}
                >
                  {roleLabels[profile.role] || profile.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Switch Store button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSwitchStore}
            disabled={switchingStore}
            className="text-xs text-muted-foreground hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
          >
            {switchingStore ? "Memuat..." : "← Ganti Toko"}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-dim mt-4">
          &copy; 2026 KasirPro. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
