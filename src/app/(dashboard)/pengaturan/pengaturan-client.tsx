"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Save, Store, User, Receipt, Users, Percent, Trash2, Printer } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSetting } from "@/lib/actions/settings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface PengaturanClientProps {
  settings: Record<string, unknown>;
  users: UserRecord[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const settingsTabs = [
  { label: "Toko", value: "toko" },
  { label: "Akun", value: "akun" },
  { label: "Pajak", value: "pajak" },
  { label: "Struk", value: "struk" },
  { label: "Printer", value: "printer" },
  { label: "Pengguna", value: "pengguna" },
];

export default function PengaturanClient({ settings, users }: PengaturanClientProps) {
  const [activeTab, setActiveTab] = useState("toko");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Extract settings with defaults
  const store = (settings.store as Record<string, string>) || {};
  const tax = (settings.tax as Record<string, string>) || {};
  const receipt = (settings.receipt as Record<string, string>) || {};
  const printerSettings = (settings.printer as Record<string, string>) || {};

  function handleSaveSettings(key: string, formData: FormData) {
    const data: Record<string, string> = {};
    formData.forEach((value, fieldKey) => {
      data[fieldKey] = value as string;
    });

    startTransition(async () => {
      try {
        await updateSetting(key, data);
        router.refresh();
        toast.success("Pengaturan berhasil disimpan");
      } catch {
        toast.error("Gagal menyimpan pengaturan");
      }
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="animate-fade-up">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
          Pengaturan
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Konfigurasi sistem dan preferensi toko
        </p>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Tabs tabs={settingsTabs} value={activeTab} onChange={setActiveTab} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
        {/* Toko */}
        {activeTab === "toko" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]">
                  <Store size={15} className="text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Informasi Toko</CardTitle>
                  <CardDescription>
                    Atur informasi dasar toko Anda
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings("store", new FormData(e.currentTarget));
                }}
                className="space-y-4 max-w-lg"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Toko
                  </label>
                  <Input name="name" defaultValue={(store.name as string) || "Toko Maju Jaya"} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Alamat
                  </label>
                  <Input name="address" defaultValue={(store.address as string) || ""} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Telepon
                    </label>
                    <Input name="phone" defaultValue={(store.phone as string) || ""} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input name="email" defaultValue={(store.email as string) || ""} />
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  <Save size={14} />
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Akun */}
        {activeTab === "akun" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(6,182,212,0.25)]">
                  <User size={15} className="text-cyan-400" />
                </div>
                <div>
                  <CardTitle>Akun Saya</CardTitle>
                  <CardDescription>
                    Ubah informasi akun dan kata sandi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nama Lengkap
                    </label>
                    <Input defaultValue="Admin Utama" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input defaultValue="admin@kasirpro.id" />
                  </div>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <p className="text-xs font-medium text-muted-foreground">
                  Ubah Kata Sandi
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Kata Sandi Lama
                  </label>
                  <Input type="password" placeholder="Masukkan kata sandi lama" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Kata Sandi Baru
                    </label>
                    <Input type="password" placeholder="Min. 8 karakter" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Konfirmasi
                    </label>
                    <Input type="password" placeholder="Ulangi kata sandi" />
                  </div>
                </div>
                <Button type="submit">
                  <Save size={14} />
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pajak */}
        {activeTab === "pajak" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(139,92,246,0.25)]">
                  <Percent size={15} className="text-violet-400" />
                </div>
                <div>
                  <CardTitle>Pengaturan Pajak</CardTitle>
                  <CardDescription>
                    Atur tarif pajak yang berlaku
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings("tax", new FormData(e.currentTarget));
                }}
                className="space-y-4 max-w-lg"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nama Pajak
                    </label>
                    <Input name="taxName" defaultValue={(tax.taxName as string) || "PPN"} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tarif (%)
                    </label>
                    <Input name="taxRate" type="number" defaultValue={(tax.taxRate as string) || "11"} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ditampilkan di struk
                  </label>
                  <Select
                    name="showOnReceipt"
                    options={[
                      { label: "Ya, tampilkan terpisah", value: "yes" },
                      { label: "Tidak, sudah termasuk harga", value: "no" },
                    ]}
                    defaultValue={(tax.showOnReceipt as string) || "yes"}
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  <Save size={14} />
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Struk */}
        {activeTab === "struk" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]">
                  <Receipt size={15} className="text-amber-400" />
                </div>
                <div>
                  <CardTitle>Template Struk</CardTitle>
                  <CardDescription>
                    Kustomisasi tampilan struk pembayaran
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings("receipt", new FormData(e.currentTarget));
                }}
                className="space-y-4 max-w-lg"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Header Struk
                  </label>
                  <Input name="header" defaultValue={(receipt.header as string) || "Toko Maju Jaya"} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Alamat di Struk
                  </label>
                  <Input name="address" defaultValue={(receipt.address as string) || ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Footer Struk
                  </label>
                  <Input name="footer" defaultValue={(receipt.footer as string) || "Terima kasih atas kunjungan Anda!"} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ukuran Kertas
                    </label>
                    <Select
                      name="paperSize"
                      options={[
                        { label: "58mm", value: "58" },
                        { label: "80mm", value: "80" },
                      ]}
                      defaultValue={(receipt.paperSize as string) || "58"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tampilkan Logo
                    </label>
                    <Select
                      name="showLogo"
                      options={[
                        { label: "Ya", value: "yes" },
                        { label: "Tidak", value: "no" },
                      ]}
                      defaultValue={(receipt.showLogo as string) || "no"}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  <Save size={14} />
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Printer */}
        {activeTab === "printer" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(56,189,248,0.25)]">
                  <Printer size={15} className="text-sky-400" />
                </div>
                <div>
                  <CardTitle>Pengaturan Printer Thermal</CardTitle>
                  <CardDescription>
                    Konfigurasi koneksi dan preferensi cetak
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSettings("printer", new FormData(e.currentTarget));
                }}
                className="space-y-4 max-w-lg"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tipe Koneksi
                  </label>
                  <Select
                    name="connectionType"
                    options={[
                      { label: "USB", value: "usb" },
                      { label: "Bluetooth", value: "bluetooth" },
                      { label: "Network (IP)", value: "network" },
                    ]}
                    defaultValue={(printerSettings.connectionType as string) || "usb"}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Printer / Alamat IP
                  </label>
                  <Input name="printerName" defaultValue={(printerSettings.printerName as string) || "POS-58 Thermal Printer"} placeholder="Nama printer atau alamat IP" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Lebar Kertas
                    </label>
                    <Select
                      name="paperWidth"
                      options={[
                        { label: "58mm", value: "58" },
                        { label: "80mm", value: "80" },
                      ]}
                      defaultValue={(printerSettings.paperWidth as string) || "58"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Kepadatan Cetak
                    </label>
                    <Select
                      name="density"
                      options={[
                        { label: "Ringan", value: "light" },
                        { label: "Normal", value: "normal" },
                        { label: "Tebal", value: "bold" },
                      ]}
                      defaultValue={(printerSettings.density as string) || "normal"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Auto-Cut Kertas
                    </label>
                    <Select
                      name="autoCut"
                      options={[
                        { label: "Ya", value: "yes" },
                        { label: "Tidak", value: "no" },
                      ]}
                      defaultValue={(printerSettings.autoCut as string) || "yes"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Buka Laci Kas Saat Cetak
                    </label>
                    <Select
                      name="openDrawer"
                      options={[
                        { label: "Ya", value: "yes" },
                        { label: "Tidak", value: "no" },
                      ]}
                      defaultValue={(printerSettings.openDrawer as string) || "no"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Character Set / Encoding
                    </label>
                    <Select
                      name="encoding"
                      options={[
                        { label: "UTF-8", value: "utf8" },
                        { label: "ASCII", value: "ascii" },
                        { label: "ISO-8859-1", value: "iso" },
                        { label: "Windows-1252", value: "win1252" },
                      ]}
                      defaultValue={(printerSettings.encoding as string) || "utf8"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Jumlah Salinan
                    </label>
                    <Select
                      name="copies"
                      options={[
                        { label: "1 lembar", value: "1" },
                        { label: "2 lembar", value: "2" },
                        { label: "3 lembar", value: "3" },
                      ]}
                      defaultValue={(printerSettings.copies as string) || "1"}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Logo pada Struk
                  </label>
                  <Select
                    name="printLogo"
                    options={[
                      { label: "Ya, tampilkan logo", value: "yes" },
                      { label: "Tidak", value: "no" },
                    ]}
                    defaultValue={(printerSettings.printLogo as string) || "no"}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="submit" disabled={isPending}>
                    <Save size={14} />
                    Simpan Perubahan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info("Test print berhasil dikirim!")}
                  >
                    <Printer size={14} />
                    Test Print
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pengguna */}
        {activeTab === "pengguna" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(244,63,94,0.25)]">
                    <Users size={15} className="text-rose-400" />
                  </div>
                  <div>
                    <CardTitle>Manajemen Pengguna</CardTitle>
                    <CardDescription>Kelola akses pengguna sistem</CardDescription>
                  </div>
                </div>
                <Button size="sm">
                  <Users size={14} />
                  Tambah Pengguna
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                        Email
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                        Role
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                        Bergabung
                      </th>
                      <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-all duration-300"
                      >
                        <td className="py-3 text-xs font-medium text-foreground">
                          {user.name}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {user.email}
                        </td>
                        <td className="py-3">
                          <Badge variant={user.role === "owner" ? "default" : "outline"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon">
                            <Trash2 size={13} className="text-destructive/60" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          Belum ada pengguna
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
