"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { cn, formatRupiah } from "@/lib/utils";
import {
  QrCode,
  Search,
  Download,
  Printer,
  Copy,
  ScanLine,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getVariantByBarcode } from "@/lib/actions/products";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantFlat {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  size: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  status: string;
  productId: string;
  productName: string;
  brand: string;
  categoryName: string;
}

export interface BarcodeClientProps {
  variants: VariantFlat[];
}

// ---------------------------------------------------------------------------
// Barcode SVG Generator (simplified EAN-style visual)
// ---------------------------------------------------------------------------

function BarcodeVisual({ code, width = 200, height = 80 }: { code: string; width?: number; height?: number }) {
  const bars: boolean[] = [];
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]);
    bars.push(true, false);
    for (let j = 0; j < 4; j++) {
      bars.push((digit >> j & 1) === 1);
    }
  }

  const barWidth = width / bars.length;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded-lg">
        {bars.map((filled, i) => (
          <rect
            key={i}
            x={i * barWidth}
            y={0}
            width={barWidth}
            height={height}
            fill={filled ? "white" : "transparent"}
            opacity={filled ? 0.9 : 0}
          />
        ))}
      </svg>
      <span className="text-xs font-num text-muted-foreground tracking-[0.25em]">
        {code}
      </span>
    </div>
  );
}

function QRCodeVisual({ code, size = 120 }: { code: string; size?: number }) {
  const gridSize = 11;
  const cellSize = size / gridSize;
  const cells: boolean[][] = [];

  for (let row = 0; row < gridSize; row++) {
    cells[row] = [];
    for (let col = 0; col < gridSize; col++) {
      const isFinderTopLeft = row < 3 && col < 3;
      const isFinderTopRight = row < 3 && col >= gridSize - 3;
      const isFinderBottomLeft = row >= gridSize - 3 && col < 3;

      if (isFinderTopLeft || isFinderTopRight || isFinderBottomLeft) {
        const cornerRow = isFinderBottomLeft ? row - (gridSize - 3) : row;
        const cornerCol = isFinderTopRight ? col - (gridSize - 3) : col;
        cells[row][col] = cornerRow === 0 || cornerRow === 2 || cornerCol === 0 || cornerCol === 2 || (cornerRow === 1 && cornerCol === 1);
      } else {
        const charIdx = (row * gridSize + col) % code.length;
        const charCode = code.charCodeAt(charIdx);
        cells[row][col] = (charCode + row * 7 + col * 13) % 3 !== 0;
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
        {cells.map((row, r) =>
          row.map((filled, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={filled ? "white" : "transparent"}
              opacity={filled ? 0.9 : 0}
              rx={1}
            />
          ))
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const pageTabs = [
  { label: "Generator", value: "generator" },
  { label: "Scanner", value: "scanner" },
  { label: "Batch Print", value: "batch" },
];

const barcodeTypes = [
  { label: "Barcode (EAN-13)", value: "barcode" },
  { label: "QR Code", value: "qrcode" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BarcodeClient({ variants }: BarcodeClientProps) {
  const [tab, setTab] = useState("generator");
  const [search, setSearch] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<VariantFlat | null>(null);
  const [barcodeType, setBarcodeType] = useState("barcode");
  const [scanResult, setScanResult] = useState<{
    productName: string;
    sku: string;
    barcode: string;
    sellPrice: number;
    categoryName: string;
    color: string;
    size: string;
  } | null>(null);
  const [scanNotFound, setScanNotFound] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [printQty, setPrintQty] = useState("1");
  const [isPending, startTransition] = useTransition();

  const filtered = variants.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  function handleScan() {
    if (!scanInput.trim()) return;
    startTransition(async () => {
      try {
        const variant = await getVariantByBarcode(scanInput.trim());
        if (variant) {
          setScanResult({
            productName: variant.product.name,
            sku: variant.sku,
            barcode: variant.barcode,
            sellPrice: variant.sellPrice,
            categoryName: variant.product.category?.name || "-",
            color: variant.color,
            size: variant.size,
          });
          setScanNotFound(false);
        } else {
          setScanResult(null);
          setScanNotFound(true);
        }
      } catch {
        toast.error("Gagal mencari barcode");
        setScanResult(null);
        setScanNotFound(true);
      }
    });
  }

  function togglePrintSelect(id: string) {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
          Barcode & QR Code
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Generate, scan, dan cetak barcode produk
        </p>
      </div>

      {/* Tabs */}
      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Tabs tabs={pageTabs} value={tab} onChange={setTab} />
      </div>

      {/* Generator Tab */}
      {tab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* Product list */}
          <div className="lg:col-span-3 space-y-3">
            <Input
              placeholder="Cari produk, SKU, atau barcode..."
              icon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                        SKU
                      </th>
                      <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                        Barcode
                      </th>
                      <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((variant) => (
                      <tr
                        key={variant.id}
                        className={cn(
                          "border-b border-white/[0.04] transition-all duration-300 cursor-pointer",
                          selectedVariant?.id === variant.id
                            ? "bg-accent/[0.06]"
                            : "hover:bg-white/[0.025]"
                        )}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        <td className="px-3 md:px-4 py-3 text-xs font-medium text-foreground">
                          {variant.productName}
                          {(variant.color || variant.size) && (
                            <span className="text-muted-foreground ml-1">
                              ({[variant.color, variant.size].filter(Boolean).join(", ")})
                            </span>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">
                          {variant.sku}
                        </td>
                        <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                          {variant.barcode}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariant(variant);
                            }}
                          >
                            <QrCode size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Tidak ada produk ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-2">
            <Card className="p-5 space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(139,92,246,0.25)]">
                    <QrCode size={15} className="text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
                    Preview
                  </span>
                </div>
                <Select
                  options={barcodeTypes}
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value)}
                  className="w-36"
                />
              </div>

              {selectedVariant ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-6 rounded-xl bg-black/30 border border-white/[0.06]">
                    {barcodeType === "barcode" ? (
                      <BarcodeVisual code={selectedVariant.barcode} />
                    ) : (
                      <QRCodeVisual code={selectedVariant.barcode} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Produk</span>
                      <span className="text-foreground font-medium">{selectedVariant.productName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="text-foreground font-num">{selectedVariant.sku}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Harga</span>
                      <span className="text-foreground font-num font-semibold">{formatRupiah(selectedVariant.sellPrice)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedVariant.barcode);
                        toast.success("Barcode disalin!");
                      }}
                    >
                      <Copy size={13} />
                      Salin
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => toast.info("Fitur unduh akan segera tersedia")}>
                      <Download size={13} />
                      Unduh
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => toast.info("Fitur cetak akan segera tersedia")}>
                      <Printer size={13} />
                      Cetak
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <Package size={32} className="text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Pilih produk</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Klik produk untuk generate barcode
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Scanner Tab */}
      {tab === "scanner" && (
        <div className="max-w-xl mx-auto space-y-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <Card className="p-5 space-y-4">
            <CardHeader className="p-0 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(6,182,212,0.25)]">
                  <ScanLine size={15} className="text-cyan-400" />
                </div>
                <div>
                  <CardTitle>Scan Barcode</CardTitle>
                  <CardDescription>
                    Masukkan barcode atau SKU secara manual
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Scan area */}
            <div className="relative rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
                <ScanLine size={28} className="text-cyan-400/60" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Arahkan barcode ke kamera atau masukkan kode manual di bawah
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Masukkan barcode..."
                icon={<Search size={15} />}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="flex-1"
              />
              <Button onClick={handleScan} disabled={isPending}>
                <ScanLine size={15} />
                Scan
              </Button>
            </div>
          </Card>

          {/* Result */}
          {(scanResult || scanNotFound) && (
            <Card className={cn(
              "p-4 border-l-2",
              scanResult ? "border-l-emerald-500/50" : "border-l-rose-500/50"
            )}>
              {scanResult ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{scanResult.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {scanResult.sku} {scanResult.color && `- ${scanResult.color}`} {scanResult.size && `- ${scanResult.size}`} - {scanResult.categoryName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success">Ditemukan</Badge>
                      <span className="text-sm font-bold font-num text-foreground">
                        {formatRupiah(scanResult.sellPrice)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-dim font-num tracking-wider">
                      {scanResult.barcode}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(244,63,94,0.25)]">
                    <AlertCircle size={18} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Produk Tidak Ditemukan</p>
                    <p className="text-xs text-muted-foreground">
                      Kode &quot;{scanInput}&quot; tidak cocok dengan produk manapun
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Batch Print Tab */}
      {tab === "batch" && (
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Select
                options={[
                  { label: "1 per produk", value: "1" },
                  { label: "2 per produk", value: "2" },
                  { label: "5 per produk", value: "5" },
                  { label: "10 per produk", value: "10" },
                ]}
                value={printQty}
                onChange={(e) => setPrintQty(e.target.value)}
                className="w-40"
              />
              <span className="text-xs text-muted-foreground">
                {selectedForPrint.size} produk dipilih
              </span>
            </div>
            <Button
              disabled={selectedForPrint.size === 0}
              onClick={() => toast.info(`Mencetak ${selectedForPrint.size} barcode x ${printQty} lembar`)}
            >
              <Printer size={15} />
              Cetak {selectedForPrint.size > 0 ? `(${selectedForPrint.size})` : ""}
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/[0.04] accent-emerald-500"
                        checked={selectedForPrint.size === variants.length && variants.length > 0}
                        onChange={() => {
                          if (selectedForPrint.size === variants.length) {
                            setSelectedForPrint(new Set());
                          } else {
                            setSelectedForPrint(new Set(variants.map((p) => p.id)));
                          }
                        }}
                      />
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                      SKU
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                      Barcode
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                      Kategori
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Harga
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr
                      key={variant.id}
                      className={cn(
                        "border-b border-white/[0.04] transition-all duration-300 cursor-pointer",
                        selectedForPrint.has(variant.id)
                          ? "bg-accent/[0.04]"
                          : "hover:bg-white/[0.025]"
                      )}
                      onClick={() => togglePrintSelect(variant.id)}
                    >
                      <td className="px-3 md:px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-white/[0.04] accent-emerald-500"
                          checked={selectedForPrint.has(variant.id)}
                          onChange={() => togglePrintSelect(variant.id)}
                        />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs font-medium text-foreground">
                        {variant.productName}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">
                        {variant.sku}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                        {variant.barcode}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {variant.categoryName}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                        {formatRupiah(variant.sellPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
