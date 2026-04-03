import { getSubscriptionPlans } from "@/lib/actions/admin-subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PriceEditor } from "./price-editor";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default async function AdminPlansPage() {
  const plans = await getSubscriptionPlans();

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Paket</h1>
        <p className="text-muted-foreground font-medium">Atur harga dan visibilitas paket langganan Noru POS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden border-border shadow-sm group hover:border-violet-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="h-16 w-16 text-violet-600" />
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20">
                  {plan.billingCycle.toUpperCase()}
                </Badge>
                {plan.isActive && (
                  <Badge variant="success" className="gap-1 border-none bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold mt-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-500" />
                {plan.name}
              </CardTitle>
              <CardDescription className="text-sm font-medium mt-1 leading-relaxed">
                {plan.description || "Paket lengkap untuk semua fitur POS Noru."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-surface border border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Subscription Price</span>
                <PriceEditor planId={plan.id} currentPrice={plan.price} />
                <span className="text-[10px] text-muted-foreground mt-0.5">* Belum termasuk PPN 11% saat checkout</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Included Features</p>
                <div className="space-y-2.5">
                  <FeatureItem label="Unlimited Transactions" />
                  <FeatureItem label="Multi-Outlet Support" />
                  <FeatureItem label="Inventory & BOM" />
                  <FeatureItem label="Full Analytics Dashboard" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="col-span-full border-dashed border-2 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-violet-500/50" />
            </div>
            <CardTitle className="text-lg">Belum Ada Paket</CardTitle>
            <CardDescription className="max-w-[250px] mx-auto mt-2">
              Jalankan script database untuk membuat paket Pro pertama Anda.
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
        <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
      </div>
      <span className="text-sm font-medium text-foreground/80">{label}</span>
    </div>
  );
}
