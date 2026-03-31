"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

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
        router.push("/select-store");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "10%", right: "15%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", bottom: "10%", left: "20%" }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-up">
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-lg)]">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mb-4 shadow-lg shadow-violet-500/20">
              <Sparkles size={28} />
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
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  className="pl-10 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-border bg-input accent-accent cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">
                  Ingat saya
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer"
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
              <Link
                href="/register"
                className="text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Daftar Sekarang
              </Link>
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
