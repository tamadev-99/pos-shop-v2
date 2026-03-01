"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Save, Store, User, Receipt, Users, Percent, Trash2, Printer, Usb, Wifi, Bluetooth } from "lucide-react";
import { useState, useTransition } from "react";
import { updateSetting, updateUserRole } from "@/lib/actions/settings";
import { toast } from "sonner";

const settingsTabs = [
  { label: "Toko", value: "toko" },
  { label: "Akun", value: "akun" },
  { label: "Pajak", value: "pajak" },
  { label: "Struk", value: "struk" },
  { label: "Printer", value: "printer" },
  { label: "Pengguna", value: "pengguna" },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
}

interface Props {
  initialSettings: Record<string, any>;
  users: UserData[];
}

export default function PengaturanClient({ initialSettings, users }: Props) {
  const [activeTab, setActiveTab] = useState("toko");
  const [isPending, startTransition] = useTransition();

  // Local state for settings to update
  const [storeName, setStoreName] = useState(initialSettings["storeName"] || "Toko Maju Jaya");
  const [storeAddress, setStoreAddress] = useState(initialSettings["storeAddress"] || "Jl. Raya Utama No. 123, Jakarta");
  const [storePhone, setStorePhone] = useState(initialSettings["storePhone"] || "021-5551234");
  const [storeEmail, setStoreEmail] = useState(initialSettings["storeEmail"] || "info@tokomajujaya.id");

  const [taxName, setTaxName] = useState(initialSettings["taxName"] || "PPN");
  const [taxRate, setTaxRate] = useState(initialSettings["taxRate"] || "11");
  const [taxIncluded, setTaxIncluded] = useState(initialSettings["taxIncluded"] || "no");

  const [receiptHeader, setReceiptHeader] = useState(initialSettings["receiptHeader"] || "Toko Maju Jaya");
  const [receiptAddress, setReceiptAddress] = useState(initialSettings["receiptAddress"] || "Jl. Raya Utama No. 123");
  const [receiptFooter, setReceiptFooter] = useState(initialSettings["receiptFooter"] || "Terima kasih atas kunjungan Anda!");
  const [receiptWidth, setReceiptWidth] = useState(initialSettings["receiptWidth"] || "58");
  const [receiptLogo, setReceiptLogo] = useState(initialSettings["receiptLogo"] || "no");

  const [printerType, setPrinterType] = useState(initialSettings["printerType"] || "usb");
  const [printerTarget, setPrinterTarget] = useState(initialSettings["printerTarget"] || "POS-58 Thermal Printer");

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting("storeName", storeName);
      await updateSetting("storeAddress", storeAddress);
      await updateSetting("storePhone", storePhone);
      await updateSetting("storeEmail", storeEmail);
      toast.success("Informasi toko berhasil disimpan!");
    });
  };

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting("taxName", taxName);
      await updateSetting("taxRate", taxRate);
      await updateSetting("taxIncluded", taxIncluded);
      toast.success("Pengaturan pajak berhasil disimpan!");
    });
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting("receiptHeader", receiptHeader);
      await updateSetting("receiptAddress", receiptAddress);
      await updateSetting("receiptFooter", receiptFooter);
      await updateSetting("receiptWidth", receiptWidth);
      await updateSetting("receiptLogo", receiptLogo);
      toast.success("Template struk berhasil disimpan!");
    });
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting("printerType", printerType);
      await updateSetting("printerTarget", printerTarget);
      toast.success("Pengaturan printer berhasil disimpan!");
    });
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    startTransition(async () => {
      await updateUserRole(userId, newRole as "cashier" | "manager" | "owner");
      toast.success("Role pengguna berhasil diubah!");
    });
  };

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
              <form onSubmit={handleSaveStore} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Toko
                  </label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Alamat
                  </label>
                  <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Telepon
                    </label>
                    <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
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
              <form onSubmit={handleSaveTax} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nama Pajak
                    </label>
                    <Input value={taxName} onChange={(e) => setTaxName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tarif (%)
                    </label>
                    <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Metode Pajak
                  </label>
                  <Select
                    options={[
                      { label: "Tidak Diterapkan", value: "no" },
                      { label: "Ditambahkan", value: "exclude" },
                      { label: "Sudah Termasuk (Include)", value: "include" },
                    ]}
                    value={taxIncluded}
                    onChange={(e) => setTaxIncluded(e.target.value)}
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
              <form onSubmit={handleSaveReceipt} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Header Struk
                  </label>
                  <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Alamat di Struk
                  </label>
                  <Input value={receiptAddress} onChange={(e) => setReceiptAddress(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Footer Struk
                  </label>
                  <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ukuran Kertas
                    </label>
                    <Select
                      options={[
                        { label: "58mm", value: "58" },
                        { label: "80mm", value: "80" },
                      ]}
                      value={receiptWidth}
                      onChange={(e) => setReceiptWidth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tampilkan Logo
                    </label>
                    <Select
                      options={[
                        { label: "Ya", value: "yes" },
                        { label: "Tidak", value: "no" },
                      ]}
                      value={receiptLogo}
                      onChange={(e) => setReceiptLogo(e.target.value)}
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
              <form onSubmit={handleSavePrinter} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tipe Koneksi
                  </label>
                  <Select
                    options={[
                      { label: "USB", value: "usb" },
                      { label: "Bluetooth", value: "bluetooth" },
                      { label: "Network (IP)", value: "network" },
                    ]}
                    value={printerType}
                    onChange={(e) => setPrinterType(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Printer / Alamat IP
                  </label>
                  <Input value={printerTarget} onChange={(e) => setPrinterTarget(e.target.value)} placeholder="Nama printer atau alamat IP" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="submit" disabled={isPending}>
                    <Save size={14} />
                    Simpan Perubahan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast("Test print berhasil dikirim!")}
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
                          <Select
                            options={[
                              { label: "Cashier", value: "cashier" },
                              { label: "Manager", value: "manager" },
                              { label: "Owner", value: "owner" },
                            ]}
                            value={user.role || "cashier"}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
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
