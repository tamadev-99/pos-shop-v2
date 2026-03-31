"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { selectStoreAction } from "@/app/select-store/actions";
import { toast } from "sonner";

interface Store {
  id: string;
  name: string;
  type: "clothing" | "minimart";
}

export function StoreSelectorClient({ stores }: { stores: Store[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState<string | null>(null);

  const handleSelect = async (storeId: string) => {
    setIsPending(storeId);
    try {
      const result = await selectStoreAction(storeId);
      if (result.success) {
        toast.success(`Berpindah ke ${stores.find(s => s.id === storeId)?.name}!`);
        router.push("/select-employee");
      } else {
        toast.error(result.error || "Failed to select store");
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsPending(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <Card 
          key={store.id} 
          className="group relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10"
          onClick={() => handleSelect(store.id)}
        >
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {store.type === "clothing" ? (
                  <ShoppingBag className="w-7 h-7 text-indigo-400" />
                ) : (
                  <Store className="w-7 h-7 text-indigo-400" />
                )}
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-400 capitalize">
                {store.type}
              </Badge>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{store.name}</h3>
            <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-semibold">Siap Dikelola</p>
            
            <Button 
              className="w-full bg-slate-800 hover:bg-slate-700 group-hover:bg-indigo-600 transition-all border-0 h-12"
              disabled={!!isPending}
            >
              {isPending === store.id ? (
                "Memuat..."
              ) : (
                <>Masuk ke Toko <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </div>
        </Card>
      ))}

      {/* Add New Store Option */}
      <Card 
        className="group border-dashed border-slate-800 bg-transparent hover:bg-slate-900/30 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center"
        onClick={() => router.push("/onboarding")}
      >
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-indigo-600/20 group-hover:scale-110 transition-all">
          <Plus className="w-8 h-8 text-slate-500 group-hover:text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">Tambah Toko Baru</h3>
        <p className="text-slate-500 text-sm">Perluas jaringan bisnis Anda</p>
      </Card>
    </div>
  );
}
