"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { registerOwner } from "./actions";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerOwner(name, email, password);
      if (!result.success) {
        toast.error(result.error || "Pendaftaran gagal.");
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await authClient.signIn.email({ email, password });
      if (signInResult.error) {
        toast.error("Akun berhasil dibuat! Silakan login.");
        router.push("/login");
        return;
      }

      toast.success("Akun berhasil dibuat! Mari setup toko pertamamu.");
      router.push("/onboarding");
      router.refresh();
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
          className="absolute w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "-5%", right: "10%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", bottom: "5%", left: "10%" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-up">
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-lg)]">

          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mb-4 shadow-lg shadow-violet-500/20">
              <Sparkles size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              <span className="text-gradient">Daftar KasirPro</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              Buat akun Owner dan mulai kelola bisnis Anda
            </p>
          </div>

          {/* Benefit Banner */}
          <div className="mb-6 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-violet-400 shrink-0" />
            <p className="text-[11px] text-violet-300 leading-relaxed">
              Gratis 14 hari. Tidak perlu kartu kredit. Setup dalam 2 menit.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nama pemilik toko"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
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
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  className="pl-10 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi kata sandi"
                  className="pl-10 pr-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Membuat Akun...
                </>
              ) : (
                <>
                  Buat Akun Gratis
                  <ArrowRight size={15} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-xs text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Masuk Sekarang
              </Link>
            </span>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-dim mt-6">
          &copy; 2026 KasirPro. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
