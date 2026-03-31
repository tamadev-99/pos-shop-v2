"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Save, CheckSquare, Square, Info } from "lucide-react";
import { toast } from "sonner";
import { saveRolePermissions } from "@/lib/actions/permissions";
import { getAccessiblePaths } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface HakAksesTabProps {
  initialPermissions?: Record<string, string[]>;
}

// Full list of available modules based on navItems in Sidebar
const AVAILABLE_MODULES = [
  { path: "/", label: "Dashboard", description: "Melihat statistik dan ringkasan penjualan" },
  { path: "/pos", label: "Kasir (POS)", description: "Melakukan transaksi penjualan harian" },
  { path: "/pesanan", label: "Pesanan & Retur", description: "Mengelola riwayat pesanan dan retur" },
  { path: "/produk", label: "Katalog & Stok", description: "Mengubah produk, varian, dan inventaris" },
  { path: "/pembelian", label: "Pembelian & Pemasok", description: "Mencatat dan mengelola kulakan" },
  { path: "/kontak", label: "Member & Pelanggan", description: "Melihat data dan riwayat member" },
  { path: "/promosi", label: "Promosi", description: "Mengelola kupon dan program diskon" },
  { path: "/karyawan", label: "Karyawan", description: "Mengelola staff dan PIN akses" },
  { path: "/laporan", label: "Laporan & Keuangan", description: "Analisis penjualan dan profitabilitas" },
  { path: "/shift", label: "Manajemen Shift", description: "Riwayat kas awal dan akhir" },
  { path: "/audit", label: "Audit Log", description: "Log aktivitas sistem" },
  { path: "/notifikasi", label: "Notifikasi", description: "Pemberitahuan sistem" },
  { path: "/pengaturan", label: "Pengaturan Utama", description: "Kustomisasi toko dan printer" },
];

const ROLES_TO_MANAGE = [
  { id: "cashier", label: "Kasir", description: "Akses standar operasional penjualan" },
  { id: "manager", label: "Manajer", description: "Akses operasional dan manajemen menengah" },
];

export function HakAksesTab({ initialPermissions }: HakAksesTabProps) {
  const [isPending, startTransition] = useTransition();

  // Initialize state from existing custom permissions or fallback to default mapping
  const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
    const state: Record<string, string[]> = {};
    for (const role of ROLES_TO_MANAGE) {
      // If no custom permissions, fallback to the default base from RBAC
      state[role.id] = initialPermissions?.[role.id] || getAccessiblePaths(role.id, {});
    }
    return state;
  });

  const togglePermission = (roleId: string, path: string) => {
    setPermissions((prev) => {
      const current = prev[roleId] || [];
      const hasPerm = current.includes(path);
      
      return {
        ...prev,
        [roleId]: hasPerm 
          ? current.filter(p => p !== path) 
          : [...current, path]
      };
    });
  };

  const setAllPermissions = (roleId: string, state: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: state ? AVAILABLE_MODULES.map(m => m.path) : []
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      // Owner is inherently untouchable on server so we just send managed roles
      const result = await saveRolePermissions(permissions);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Pengaturan Hak Akses berhasil disimpan!");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(59,130,246,0.25)]">
            <Shield size={15} className="text-indigo-400" />
          </div>
          <div>
            <CardTitle>Hak Akses & Modul</CardTitle>
            <CardDescription>
              Tentukan fitur apa saja yang dapat diakses oleh Kasir dan Manajer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5 max-w-2xl">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-accent mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <p>Pengaturan ini bersifat spesifik untuk cabang toko ini. Pengguna dengan tipe <strong>Owner</strong> selalu memiliki akses penuh ke seluruh fitur dan tidak dapat dibatasi kemampuannya.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {ROLES_TO_MANAGE.map((role) => (
            <div key={role.id} className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{role.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{role.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAllPermissions(role.id, true)}
                    className="text-[10px] font-medium text-accent hover:underline decoration-accent/30 underline-offset-4"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-border">|</span>
                  <button 
                    onClick={() => setAllPermissions(role.id, false)}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {AVAILABLE_MODULES.map((module) => {
                  const isChecked = permissions[role.id]?.includes(module.path);
                  
                  return (
                    <button
                      key={module.path}
                      onClick={() => togglePermission(role.id, module.path)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors group cursor-pointer text-left"
                    >
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-medium transition-colors",
                          isChecked ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {module.label}
                        </span>
                        <span className="text-[10px] text-muted-dim">
                          {module.description}
                        </span>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded transition-all flex items-center justify-center shrink-0 border",
                        isChecked 
                          ? "bg-accent border-accent text-white" 
                          : "bg-surface border-border text-transparent group-hover:border-accent/40"
                      )}>
                        {isChecked && <CheckSquare size={12} className="shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex pt-2">
          <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
            <Save size={14} />
            {isPending ? "Menyimpan..." : "Simpan Hak Akses"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
