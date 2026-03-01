"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Email atau kata sandi salah");
      } else {
        toast.success("Berhasil masuk!");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced gradient mesh background */}
      <div className="absolute inset-0">
        {/* Large ambient orbs */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[180px] opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #10b981, transparent 70%)",
            top: "10%",
            right: "10%",
            animation: "orb-float-1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent 70%)",
            bottom: "5%",
            left: "15%",
            animation: "orb-float-2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #22d3ee, transparent 70%)",
            top: "60%",
            right: "40%",
            animation: "orb-float-3 30s ease-in-out infinite",
          }}
        />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-20" />
      </div>

      {/* Login Card — heavy frosted glass */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-up">
        <div className="rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] p-8 shadow-[0_16px_64px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)] gradient-border glass-shimmer">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary text-white mb-4 shadow-[0_0_48px_-8px_rgba(16,185,129,0.35)] animate-glow-breathe">
              <Zap size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              <span className="text-gradient">KasirPro</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="nama@email.com"
                icon={<Mail size={15} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  icon={<Lock size={15} />}
                  className="pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dim hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-white/10 bg-white/[0.04] accent-accent cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">
                  Ingat saya
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-muted-foreground">
              Belum punya akun?{" "}
              <button className="text-accent hover:text-accent/80 font-medium transition-colors cursor-pointer">
                Hubungi Admin
              </button>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-dim mt-6">
          &copy; 2026 KasirPro. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
