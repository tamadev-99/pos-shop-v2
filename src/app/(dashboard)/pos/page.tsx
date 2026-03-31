import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getProducts } from "@/lib/actions/products";
import { getCustomers } from "@/lib/actions/customers";
import { getActivePromotions } from "@/lib/actions/promotions";
import { getSettings } from "@/lib/actions/settings";
import { getHeldTransactions } from "@/lib/actions/orders";
import { checkCashierShift } from "@/lib/actions/shifts";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import POSClient from "./pos-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

export default async function POSPage() {
  await enforceRouteAccess('/pos');
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null; // Will be handled by middleware, but safe fallback
  }

  // Check shift status
  const shiftStatus = await checkCashierShift();

  if (!shiftStatus.hasActiveShift || shiftStatus.isPreviousDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in bg-[#03040b]">
        <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)] border border-amber-500/20">
              {shiftStatus.isPreviousDay ? (
                <Clock size={32} className="text-amber-400" />
              ) : (
                <AlertTriangle size={32} className="text-amber-400" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)] mb-3">
              {shiftStatus.isPreviousDay ? "Shift Kemarin Belum Ditutup" : "Belum Ada Shift Aktif"}
            </h1>

            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {shiftStatus.isPreviousDay
                ? "Anda memiliki shift aktif dari hari sebelumnya. Harap tutup shift tersebut terlebih dahulu sebelum memulai transaksi hari ini."
                : "Anda harus membuka shift kasir terlebih dahulu sebelum dapat mengakses menu Kasir dan melakukan transaksi."}
            </p>

            <Link href="/shift" className="block">
              <Button size="lg" className="w-full relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  Memuju Menu Shift
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-hover opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [products, customers, promotions, settings, heldTransactions] = await Promise.all([
    getProducts({ status: "aktif" }),
    getCustomers(),
    getActivePromotions(),
    getSettings(),
    getHeldTransactions(),
  ]);

  const printerConfig = {
    type: (settings.printerType as string) || "usb",
    target: (settings.printerTarget as string) || "",
    paperWidth: (settings.receiptWidth as string) || "58",
  };

  const storeName = (settings.storeName as string) || "Toko Fashion";
  const storeAddress = (settings.storeAddress as string) || "";
  const storePhone = (settings.storePhone as string) || "";

  const storeSettings = {
    ...settings,
    storeName,
    storeAddress,
    storePhone,
    taxRate: Number(settings.taxRate) || 11,
    taxIncluded: (settings.taxIncluded as string) || "no",
    receiptFooter: (settings.receiptFooter as string) || "Terima kasih atas kunjungan Anda!",
  };

  // Map DB held transactions to client format
  const initialHeldTransactions = heldTransactions.map((ht) => ({
    id: ht.id,
    items: ht.items as any[],
    customer: ht.customerId || "",
    shippingFee: ht.shippingFee || 0,
    note: ht.notes || "",
    timestamp: new Date(ht.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  }));

  return (
    <POSClient
      initialProducts={products.data}
      customers={customers as any}
      promotions={promotions as any}
      printerConfig={printerConfig as any}
      storeSettings={storeSettings}
      initialHeldTransactions={initialHeldTransactions}
    />
  );
}
