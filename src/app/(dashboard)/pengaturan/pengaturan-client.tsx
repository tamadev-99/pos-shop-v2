"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Save, Store, User, Receipt, Users, Percent, Trash2, Printer, Usb, Wifi, Bluetooth, Loader2, AlertTriangle, CheckCircle, Info, Crown, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { updateSetting } from "@/lib/actions/settings";
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
  { label: "Barcode", value: "barcode" },
];

interface Props {
  initialSettings: Record<string, any>;
  variants: any[];
}

export default function PengaturanClient({ initialSettings, variants }: Props) {
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

  const [receiptFooter, setReceiptFooter] = useState(initialSettings["receiptFooter"] || "Terima kasih atas kunjungan Anda!");
  const [receiptWidth, setReceiptWidth] = useState(initialSettings["receiptWidth"] || "58");
  const [receiptLogo, setReceiptLogo] = useState(initialSettings["receiptLogo"] || "no");
  const [receiptLogoImage, setReceiptLogoImage] = useState(initialSettings["receiptLogoImage"] || "");


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
      try {
        await Promise.all([
          updateSetting("storeName", storeName),
          updateSetting("storeAddress", storeAddress),
          updateSetting("storePhone", storePhone),
          updateSetting("storeEmail", storeEmail),
          updateSetting("receiptLogo", receiptLogo),
          updateSetting("receiptLogoImage", receiptLogoImage),
        ]);
        toast.success("Informasi toko berhasil disimpan!");
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan informasi toko");
      }
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
        await updateSetting("receiptFooter", receiptFooter);
        await updateSetting("receiptWidth", receiptWidth);
        await updateSetting("receiptLogo", receiptLogo);
        await updateSetting("receiptLogoImage", receiptLogoImage);
        toast.success("Template struk berhasil disimpan!");
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan template struk");
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize for thermal printer (max 384px width for 58mm)
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 384;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Fill white background to avoid transparent black dots
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 jpeg
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setReceiptLogoImage(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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

                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Store size={12} className="text-accent" />
                    </div>
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Identitas & Logo Struk</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tampilkan Logo di Struk
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

                  {receiptLogo === "yes" && (
                    <div className="space-y-1.5 animate-fade-down duration-200">
                      <label className="text-xs font-medium text-muted-foreground">
                        Logo Toko <span className="text-[10px] text-muted-dim">(Max 2MB)</span>
                      </label>
                      <div className="flex items-center gap-4">
                        {receiptLogoImage ? (
                          <div className="relative w-16 h-16 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={receiptLogoImage} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                            <button
                              type="button"
                              onClick={() => setReceiptLogoImage("")}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1">
                            <Plus size={16} className="text-muted-dim" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input 
                            type="file" 
                            accept="image/jpeg, image/png, image/webp" 
                            onChange={handleLogoUpload}
                            className="text-xs cursor-pointer file:cursor-pointer h-9 py-1"
                          />
                          <p className="text-[10px] text-muted-dim mt-1">Gunakan gambar resolusi tinggi dengan latar belakang putih/transparan.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? <Loader2 className="mr-2 animate-spin" size={14} /> : <Save size={14} className="mr-2" />}
                    Simpan Perubahan
                  </Button>
                </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-500">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]">
                    <Receipt size={15} className="text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>Template Struk</CardTitle>
                    <CardDescription>
                      Kustomisasi tampilan struk pembayaran Anda
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveReceipt} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Footer Struk
                    </label>
                    <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Pesan ucapan terima kasih" />
                  </div>
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
                    <p className="text-[10px] text-muted-dim mt-1">Ukuran standar printer thermal adalah 58mm atau 80mm.</p>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={isPending} className="w-full">
                      {isPending ? <Loader2 className="mr-2 animate-spin" size={14} /> : <Save size={14} className="mr-2" />}
                      Simpan Template
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Receipt Preview */}
            <div className="sticky top-6 hidden lg:block animate-fade-left">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Printer size={14} className="text-accent" />
                  Live Preview Struk
                </h3>
                <Badge variant="outline" className="font-num text-[10px] px-1.5 h-5">
                  {receiptWidth}mm
                </Badge>
              </div>
              
              <ReceiptPreview 
                data={{
                  header: storeName,
                  address: storeAddress,
                  footer: receiptFooter,
                  logo: receiptLogo === "yes" ? receiptLogoImage : null,
                  width: receiptWidth
                }}
              />
            </div>
          </div>
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



        {/* Barcode */}
        {activeTab === "barcode" && (
          <BarcodeTab variants={variants} />
        )}
      </div>
    </div>
  );
}

function ReceiptPreview({ data }: { data: any }) {
  const now = new Date();
  const W = data.width === "80" ? 48 : 32;

  return (
    <div className={`mx-auto bg-white text-black font-mono p-6 shadow-2xl rounded-sm border-t-8 border-accent transition-all duration-300 relative overflow-hidden`} style={{ width: data.width === "80" ? "300px" : "240px", fontSize: "11px" }}>
      {/* Simulation of a physical paper texture/shadow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/[0.02] to-transparent" />
      
      <div className="relative z-10 space-y-4">
        {/* Logo */}
        {data.logo && (
          <div className="flex justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.logo} alt="Preview Logo" className="max-w-[80px] max-h-[80px] object-contain filter grayscale" />
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-0.5">
          <p className="font-bold text-sm uppercase leading-tight">{data.header || "NAMA TOKO ANDA"}</p>
          <p className="text-[10px] opacity-70 italic">{data.address || "Alamat Toko Anda..."}</p>
        </div>

        <div className="border-b border-dashed border-black/20 my-2" />

        {/* Info */}
        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between"><span>No. Order</span><span>#SAMPLE-2024</span></div>
          <div className="flex justify-between"><span>Tanggal</span><span>{now.toLocaleDateString("id-ID")}</span></div>
          <div className="flex justify-between"><span>Kasir</span><span>Admin</span></div>
        </div>

        <div className="border-b border-dashed border-black/20 my-2" />

        {/* Items */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <div className="flex-1 pr-2">
              <p className="font-bold uppercase">CONTOH PRODUK A</p>
              <p className="text-[9px] opacity-60 italic">2 x Rp 25.000</p>
            </div>
            <p className="font-bold">Rp 50.000</p>
          </div>
          <div className="flex justify-between">
            <div className="flex-1 pr-2">
              <p className="font-bold uppercase">CONTOH PRODUK B</p>
              <p className="text-[9px] opacity-60 italic">1 x Rp 15.000</p>
            </div>
            <p className="font-bold">Rp 15.000</p>
          </div>
        </div>

        <div className="border-b border-dashed border-black/20 my-2" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>Rp 65.000</span></div>
          <div className="flex justify-between"><span>PPN 11%</span><span>Rp 7.150</span></div>
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-black/10 mt-1 uppercase">
            <span>Total</span><span>Rp 72.150</span>
          </div>
        </div>

        <div className="border-b border-dashed border-black/20 my-2" />

        {/* Footer */}
        <div className="text-center space-y-0.5 opacity-70 py-2">
          <p className="leading-tight">{data.footer || "Terima kasih atas kunjungan Anda!"}</p>
          <p className="text-[9px] mt-2 font-bold tracking-widest uppercase">*** LUNAS ***</p>
        </div>

        {/* Simulation of paper edge */}
        <div className="pt-4 flex justify-center opacity-20">
          <div className="w-full h-2 border-t border-dashed border-black" />
        </div>
      </div>
    </div>
  );
}
