import { getSubscriptionStatus } from "@/lib/actions/subscription";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, AlertCircle, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default async function SubscriptionPage() {
  const status = await getSubscriptionStatus();

  // If not blocked, redirect back to dashboard
  if (!status.isBlocked) {
    redirect("/dashboard");
  }

  const isTrial = status.status === "trial";
  const expiryDateFormatted = status.trialEndsAt 
    ? new Date(status.trialEndsAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : status.subscriptionEndsAt 
      ? new Date(status.subscriptionEndsAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "Segera";

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mb-4 border border-destructive/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Akses Terbatas</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isTrial 
              ? `Masa trial 14 hari Anda untuk "${status.tenantName}" telah berakhir pada ${expiryDateFormatted}.`
              : `Masa langganan "${status.tenantName}" Anda telah berakhir pada ${expiryDateFormatted}.`
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Details */}
          <Card className="border-primary/20 bg-primary/[0.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <CardHeader>
              <CardTitle>Paket Pro Full</CardTitle>
              <CardDescription>Akses penuh ke semua fitur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">Rp 100.000</span>
                <span className="text-muted-foreground">/bulan</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Manajemen Produk & Stok Unlimitied
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Laporan Keuangan Lengkap
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Multi-Profile Pegawai
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Audit Log & Keamanan Data
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-11 text-lg font-semibold" size="lg">
                <CreditCard className="w-5 h-5 mr-2" />
                Bayar Sekarang
              </Button>
            </CardFooter>
          </Card>

          {/* Support / Help */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Butuh Bantuan?</CardTitle>
              <CardDescription>Hubungi tim support kami jika Anda mengalami kendala pembayaran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Pembayaran Aman</p>
                  <p className="text-muted-foreground leading-snug">Metode pembayaran otomatis via Mayar terproteksi SSL.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Link href="https://wa.me/your-support-number" className="w-full">
                <Button variant="outline" className="w-full">
                  Hubungi Support via WA
                </Button>
              </Link>
              <Link href="/api/auth/sign-out" className="w-full">
                <Button variant="ghost" className="w-full text-xs">
                  Logout dari Akun
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; 2026 Noru POS Enterprise. Semua Hak Dilindungi.
        </p>
      </div>
    </div>
  );
}
