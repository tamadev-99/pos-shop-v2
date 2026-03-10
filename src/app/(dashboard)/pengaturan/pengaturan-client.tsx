"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Save, Store, User, Receipt, Users, Percent, Trash2, Printer, Usb, Wifi, Bluetooth, Loader2, AlertTriangle, CheckCircle, Info, Crown, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { updateSetting, updateUserRole } from "@/lib/actions/settings";
import { toast } from "sonner";
import {
  buildTestPageCommands,
  printReceipt,
  connectUSBPrinter,
  connectBluetoothPrinter,
  isWebUSBSupported,
  isWebBluetoothSupported,
  type PrinterConfig,
} from "@/lib/thermal-printer";
import { BarcodeTab } from "./barcode-tab";
import { AkunTab } from "./akun-tab";

const settingsTabs = [
  { label: "Toko", value: "toko" },
  { label: "Akun", value: "akun" },
  { label: "Pajak", value: "pajak" },
  { label: "Member", value: "member" },
  { label: "Struk", value: "struk" },
  { label: "Printer", value: "printer" },
  { label: "Pengguna", value: "pengguna" },
  { label: "Barcode", value: "barcode" },
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
  variants: any[];
}

export default function PengaturanClient({ initialSettings, users, variants }: Props) {
  const [activeTab, setActiveTab] = useState("toko");
  const [isPending, startTransition] = useTransition();

  // Local state for settings to update
  const [storeName, setStoreName] = useState(initialSettings["storeName"] || "");
  const [storeAddress, setStoreAddress] = useState(initialSettings["storeAddress"] || "");
  const [storePhone, setStorePhone] = useState(initialSettings["storePhone"] || "");
  const [storeEmail, setStoreEmail] = useState(initialSettings["storeEmail"] || "");

  const [taxName, setTaxName] = useState(initialSettings["taxName"] || "PPN");
  const [taxRate, setTaxRate] = useState(initialSettings["taxRate"] || "11");
  const [taxIncluded, setTaxIncluded] = useState(initialSettings["taxIncluded"] || "no");

  const [receiptHeader, setReceiptHeader] = useState(initialSettings["receiptHeader"] || "");
  const [receiptAddress, setReceiptAddress] = useState(initialSettings["receiptAddress"] || "");
  const [receiptFooter, setReceiptFooter] = useState(initialSettings["receiptFooter"] || "Terima kasih atas kunjungan Anda!");
  const [receiptWidth, setReceiptWidth] = useState(initialSettings["receiptWidth"] || "58");
  const [receiptLogo, setReceiptLogo] = useState(initialSettings["receiptLogo"] || "no");

  const [printerType, setPrinterType] = useState(initialSettings["printerType"] || "usb");
  const [printerTarget, setPrinterTarget] = useState(initialSettings["printerTarget"] || "POS-58 Thermal Printer");

  // Member tier settings
  const defaultMemberTiers = [
    { name: "Bronze", minPoints: 0, discount: 0, benefit: "Member dasar" },
    { name: "Silver", minPoints: 500, discount: 2, benefit: "Diskon 2% untuk semua produk" },
    { name: "Gold", minPoints: 1000, discount: 5, benefit: "Diskon 5% untuk semua produk" },
    { name: "Platinum", minPoints: 2000, discount: 10, benefit: "Diskon 10% untuk semua produk" },
  ];
  const parsedMemberTiers = (() => {
    try {
      const raw = initialSettings["memberTiers"];
      if (typeof raw === "string") return JSON.parse(raw);
      if (Array.isArray(raw)) return raw;
      return defaultMemberTiers;
    } catch {
      return defaultMemberTiers;
    }
  })();
  const [memberTiers, setMemberTiers] = useState<{ name: string; minPoints: number; discount: number; benefit: string }[]>(parsedMemberTiers);

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
      try {
        await updateSetting("receiptHeader", receiptHeader);
        await updateSetting("receiptAddress", receiptAddress);
        await updateSetting("receiptFooter", receiptFooter);
        await updateSetting("receiptWidth", receiptWidth);
        await updateSetting("receiptLogo", receiptLogo);
        toast.success("Template struk berhasil disimpan!");
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan template struk");
      }
    });
  };

  const handleSaveMemberTiers = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: names must not be empty, minPoints must be ascending
    for (let i = 0; i < memberTiers.length; i++) {
      if (!memberTiers[i].name.trim()) {
        toast.error(`Nama tier ke-${i + 1} tidak boleh kosong`);
        return;
      }
      if (i > 0 && memberTiers[i].minPoints <= memberTiers[i - 1].minPoints) {
        toast.error(`Minimum poin "${memberTiers[i].name}" harus lebih besar dari "${memberTiers[i - 1].name}"`);
        return;
      }
    }
    startTransition(async () => {
      try {
        await updateSetting("memberTiers", JSON.stringify(memberTiers));
        toast.success("Pengaturan member tier berhasil disimpan!");
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan pengaturan member tier");
      }
    });
  };

  const updateTier = (index: number, field: string, value: string | number) => {
    setMemberTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const addTier = () => {
    const lastTier = memberTiers[memberTiers.length - 1];
    setMemberTiers((prev) => [
      ...prev,
      { name: "", minPoints: (lastTier?.minPoints || 0) + 1000, discount: 0, benefit: "" },
    ]);
  };

  const removeTier = (index: number) => {
    if (memberTiers.length <= 1) {
      toast.error("Minimal harus ada 1 tier");
      return;
    }
    setMemberTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const [printerStatus, setPrinterStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [printerStatusMsg, setPrinterStatusMsg] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateSetting("printerType", printerType);
      await updateSetting("printerTarget", printerTarget);
      toast.success("Pengaturan printer berhasil disimpan!");
    });
  };

  const handleConnectPrinter = async () => {
    setPrinterStatus("connecting");
    setPrinterStatusMsg("Menghubungkan...");
    try {
      if (printerType === "usb") {
        if (!isWebUSBSupported()) {
          throw new Error("WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge.");
        }
        await connectUSBPrinter();
        setPrinterStatus("connected");
        setPrinterStatusMsg("Printer USB terhubung");
        toast.success("Printer USB berhasil terhubung!");
      } else if (printerType === "bluetooth") {
        if (!isWebBluetoothSupported()) {
          throw new Error("Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge.");
        }
        await connectBluetoothPrinter();
        setPrinterStatus("connected");
        setPrinterStatusMsg("Printer Bluetooth terhubung");
        toast.success("Printer Bluetooth berhasil terhubung!");
      } else if (printerType === "network") {
        // For network, we just validate the IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
        if (!printerTarget || !ipRegex.test(printerTarget)) {
          throw new Error("Masukkan alamat IP printer yang valid (contoh: 192.168.1.100)");
        }
        setPrinterStatus("connected");
        setPrinterStatusMsg(`Target: ${printerTarget}`);
        toast.success("Konfigurasi jaringan siap!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghubungkan printer";
      setPrinterStatus("error");
      setPrinterStatusMsg(message);
      toast.error(message);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      const paperWidth = (initialSettings["receiptWidth"] as string) === "80" ? "80" as const : "58" as const;
      const commands = buildTestPageCommands(paperWidth);
      const config: PrinterConfig = {
        type: printerType as "usb" | "bluetooth" | "network",
        target: printerTarget,
        paperWidth,
      };
      await printReceipt(commands, config);
      toast.success("Test print berhasil dikirim ke printer!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal test print";
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]">
                  <Store size={15} className="text-accent" />
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

        {/* Akun */}
        {activeTab === "akun" && (
          <AkunTab />
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
                      { label: "Ditambahkan (Exclude)", value: "exclude" },
                      { label: "Sudah Termasuk (Include)", value: "include" },
                    ]}
                    value={taxIncluded}
                    onChange={(e) => setTaxIncluded(e.target.value)}
                  />
                </div>
                <div className="rounded-xl bg-surface border border-border p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-accent mt-0.5 shrink-0" />
                    <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
                      {taxIncluded === "no" && (
                        <>
                          <p className="font-medium text-foreground text-xs">Tidak Diterapkan</p>
                          <p>Pajak tidak akan dihitung pada transaksi. Harga yang ditampilkan adalah harga final tanpa komponen pajak.</p>
                        </>
                      )}
                      {taxIncluded === "exclude" && (
                        <>
                          <p className="font-medium text-foreground text-xs">Ditambahkan (Exclude)</p>
                          <p>Pajak dihitung di atas harga produk. Pelanggan membayar harga produk + pajak.</p>
                          <div className="rounded-lg bg-card p-2 font-num text-[10px] space-y-0.5 border border-border mt-1">
                            <p>Harga produk: Rp100.000</p>
                            <p>{taxName} {taxRate}%: Rp{(100000 * Number(taxRate) / 100).toLocaleString("id-ID")}</p>
                            <p className="font-bold text-foreground border-t border-border pt-1 mt-1">Total bayar: Rp{(100000 + 100000 * Number(taxRate) / 100).toLocaleString("id-ID")}</p>
                          </div>
                        </>
                      )}
                      {taxIncluded === "include" && (
                        <>
                          <p className="font-medium text-foreground text-xs">Sudah Termasuk (Include)</p>
                          <p>Harga produk sudah termasuk pajak. Total yang dibayar pelanggan sama dengan harga yang ditampilkan — pajak dihitung mundur dari harga tersebut.</p>
                          <div className="rounded-lg bg-card p-2 font-num text-[10px] space-y-0.5 border border-border mt-1">
                            <p>Harga produk (termasuk pajak): Rp100.000</p>
                            <p>Harga sebelum pajak: Rp{Math.round(100000 / (1 + Number(taxRate) / 100)).toLocaleString("id-ID")}</p>
                            <p>{taxName} {taxRate}%: Rp{(100000 - Math.round(100000 / (1 + Number(taxRate) / 100))).toLocaleString("id-ID")}</p>
                            <p className="font-bold text-foreground border-t border-border pt-1 mt-1">Total bayar: Rp100.000</p>
                          </div>
                        </>
                      )}
                    </div>
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

        {/* Member */}
        {activeTab === "member" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]">
                  <Crown size={15} className="text-amber-400" />
                </div>
                <div>
                  <CardTitle>Pengaturan Member Tier</CardTitle>
                  <CardDescription>
                    Atur tingkatan member, minimum poin, dan benefit diskon
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveMemberTiers} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Nama Tier</th>
                        <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Minimum Poin</th>
                        <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Diskon (%)</th>
                        <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">Benefit</th>
                        <th className="pb-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberTiers.map((tier, index) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-2.5 pr-2">
                            <Input
                              value={tier.name}
                              onChange={(e) => updateTier(index, "name", e.target.value)}
                              placeholder="Nama tier"
                              className="min-w-[100px]"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <Input
                              type="number"
                              value={tier.minPoints}
                              onChange={(e) => updateTier(index, "minPoints", Number(e.target.value))}
                              placeholder="0"
                              min={0}
                              className="min-w-[100px]"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <Input
                              type="number"
                              value={tier.discount}
                              onChange={(e) => updateTier(index, "discount", Number(e.target.value))}
                              placeholder="0"
                              min={0}
                              max={100}
                              className="min-w-[80px]"
                            />
                          </td>
                          <td className="py-2.5 pr-2 hidden sm:table-cell">
                            <Input
                              value={tier.benefit}
                              onChange={(e) => updateTier(index, "benefit", e.target.value)}
                              placeholder="Deskripsi benefit"
                              className="min-w-[180px]"
                            />
                          </td>
                          <td className="py-2.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTier(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5"
                            >
                              <X size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={addTier}>
                    <Plus size={14} />
                    Tambah Tier
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <Save size={14} />
                    Simpan Perubahan
                  </Button>
                </div>

                <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-accent mt-0.5 shrink-0" />
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      <p>Tier ditentukan berdasarkan total poin pelanggan. Pastikan minimum poin berurutan dari kecil ke besar. Diskon tier akan otomatis diterapkan pada transaksi di POS.</p>
                    </div>
                  </div>
                </div>
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
                    Konfigurasi koneksi printer thermal via USB, Bluetooth, atau jaringan (LAN)
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
                      { label: "USB (WebUSB)", value: "usb" },
                      { label: "Bluetooth (Web Bluetooth)", value: "bluetooth" },
                      { label: "Network / LAN (TCP)", value: "network" },
                    ]}
                    value={printerType}
                    onChange={(e) => {
                      setPrinterType(e.target.value);
                      setPrinterStatus("idle");
                      setPrinterStatusMsg("");
                    }}
                  />
                </div>

                {/* Connection-type specific help */}
                <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5">
                  {printerType === "usb" && (
                    <>
                      <p className="text-[11px] font-medium text-sky-400 flex items-center gap-1"><Usb size={12} /> Koneksi USB (WebUSB)</p>
                      <p className="text-[10px] text-muted-dim">Klik &quot;Hubungkan Printer&quot; untuk memilih printer dari daftar perangkat USB. Memerlukan browser Chrome/Edge dan HTTPS.</p>
                      <p className="text-[10px] text-muted-dim">Windows: Mungkin perlu driver WinUSB (via Zadig) agar WebUSB bisa mengakses printer.</p>
                    </>
                  )}
                  {printerType === "bluetooth" && (
                    <>
                      <p className="text-[11px] font-medium text-violet-400 flex items-center gap-1"><Bluetooth size={12} /> Koneksi Bluetooth</p>
                      <p className="text-[10px] text-muted-dim">Klik &quot;Hubungkan Printer&quot; untuk memilih printer Bluetooth yang sudah dipasangkan. Memerlukan browser Chrome/Edge.</p>
                      <p className="text-[10px] text-muted-dim">Pastikan Bluetooth aktif dan printer dalam mode pairing.</p>
                    </>
                  )}
                  {printerType === "network" && (
                    <>
                      <p className="text-[11px] font-medium text-accent flex items-center gap-1"><Wifi size={12} /> Koneksi Network (LAN)</p>
                      <p className="text-[10px] text-muted-dim">Masukkan alamat IP printer thermal di jaringan lokal. Port default: 9100.</p>
                      <p className="text-[10px] text-muted-dim">Contoh: 192.168.1.100 atau 192.168.1.100:9100</p>
                    </>
                  )}
                </div>

                {printerType === "network" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Alamat IP Printer
                    </label>
                    <Input
                      value={printerTarget}
                      onChange={(e) => setPrinterTarget(e.target.value)}
                      placeholder="192.168.1.100"
                    />
                  </div>
                )}

                {/* Connection status */}
                {printerStatus !== "idle" && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${printerStatus === "connected" ? "border-accent-500/20 bg-accent/5 text-accent" :
                    printerStatus === "error" ? "border-red-500/20 bg-red-500/5 text-red-400" :
                      "border-sky-500/20 bg-sky-500/5 text-sky-400"
                    }`}>
                    {printerStatus === "connecting" && <Loader2 size={14} className="animate-spin" />}
                    {printerStatus === "connected" && <CheckCircle size={14} />}
                    {printerStatus === "error" && <AlertTriangle size={14} />}
                    <span>{printerStatusMsg}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button type="submit" disabled={isPending}>
                    <Save size={14} />
                    Simpan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConnectPrinter}
                    disabled={printerStatus === "connecting"}
                  >
                    {printerStatus === "connecting" ? <Loader2 size={14} className="animate-spin" /> :
                      printerType === "usb" ? <Usb size={14} /> :
                        printerType === "bluetooth" ? <Bluetooth size={14} /> :
                          <Wifi size={14} />}
                    {printerType === "network" ? "Validasi IP" : "Hubungkan Printer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestPrint}
                    disabled={isTesting}
                  >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                    {isTesting ? "Mencetak..." : "Test Print"}
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
                    <tr className="border-b border-border">
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
                        className="border-b border-border last:border-0 hover:bg-white/[0.025] transition-all duration-300"
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

        {/* Barcode */}
        {activeTab === "barcode" && (
          <BarcodeTab variants={variants} />
        )}
      </div>
    </div>
  );
}
