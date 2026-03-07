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
  Bluetooth,
} from "lucide-react";
import { useState, useTransition, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getVariantByBarcode } from "@/lib/actions/products";
import { formatRupiah as fmtR } from "@/lib/utils";
import {
  LABEL_PRESETS,
  buildBarcodeLabelCommands,
  printReceipt,
  type PrinterConfig,
} from "@/lib/thermal-printer";

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

export interface BarcodeTabProps {
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

export function BarcodeTab({ variants }: BarcodeTabProps) {
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
  const [labelSizeId, setLabelSizeId] = useState(LABEL_PRESETS[2].id); // 50×30mm default
  const [btPrinting, setBtPrinting] = useState(false);

  const selectedLabelSize = LABEL_PRESETS.find((l) => l.id === labelSizeId) || LABEL_PRESETS[2];
  const labelSizeOptions = LABEL_PRESETS.map((l) => ({ label: l.label, value: l.id }));

  const filtered = variants.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  // ── Render barcode label to canvas ────────────────────────────────────────
  const renderBarcodeToCanvas = useCallback(
    (variant: VariantFlat, type: string, scale = 3, customSize?: { widthMm: number; heightMm: number }): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      // Use label size or default proportions
      const DPM = 8; // dots per mm
      const labelW = customSize ? customSize.widthMm * DPM * (scale / 3) : 200 * scale;
      const labelH = customSize ? customSize.heightMm * DPM * (scale / 3) : 140 * scale;
      canvas.width = Math.round(labelW);
      canvas.height = Math.round(labelH);
      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, labelW, labelH);
      ctx.fillStyle = "#000";

      if (type === "barcode") {
        // Draw barcode bars
        const code = variant.barcode;
        const bars: boolean[] = [];
        for (let i = 0; i < code.length; i++) {
          const digit = parseInt(code[i]);
          bars.push(true, false);
          for (let j = 0; j < 4; j++) {
            bars.push(((digit >> j) & 1) === 1);
          }
        }
        const barcodeW = labelW * 0.8;
        const barcodeH = labelH * 0.4;
        const barW = barcodeW / bars.length;
        const startX = (labelW - barcodeW) / 2;
        const startY = 12 * scale;
        for (let i = 0; i < bars.length; i++) {
          if (bars[i]) {
            ctx.fillRect(startX + i * barW, startY, barW, barcodeH);
          }
        }
        // Barcode text
        ctx.font = `${8 * scale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(code, labelW / 2, startY + barcodeH + 12 * scale);
      } else {
        // QR code
        const gridSize = 11;
        const qrSize = labelH * 0.5;
        const cellSize = qrSize / gridSize;
        const startX = (labelW - qrSize) / 2;
        const startY = 10 * scale;
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const isFinderTL = row < 3 && col < 3;
            const isFinderTR = row < 3 && col >= gridSize - 3;
            const isFinderBL = row >= gridSize - 3 && col < 3;
            let filled = false;
            if (isFinderTL || isFinderTR || isFinderBL) {
              const cr = isFinderBL ? row - (gridSize - 3) : row;
              const cc = isFinderTR ? col - (gridSize - 3) : col;
              filled = cr === 0 || cr === 2 || cc === 0 || cc === 2 || (cr === 1 && cc === 1);
            } else {
              const charIdx = (row * gridSize + col) % variant.barcode.length;
              const charCode = variant.barcode.charCodeAt(charIdx);
              filled = (charCode + row * 7 + col * 13) % 3 !== 0;
            }
            if (filled) {
              ctx.fillRect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      // Product name
      ctx.font = `bold ${7 * scale}px sans-serif`;
      ctx.textAlign = "center";
      const nameY = labelH - 24 * scale;
      const displayName = variant.productName.length > 24 ? variant.productName.slice(0, 22) + "..." : variant.productName;
      ctx.fillText(displayName, labelW / 2, nameY);

      // Price
      ctx.font = `bold ${8 * scale}px sans-serif`;
      ctx.fillText(formatRupiah(variant.sellPrice), labelW / 2, nameY + 12 * scale);

      return canvas;
    },
    []
  );

  const handleDownload = useCallback(() => {
    if (!selectedVariant) return;
    const canvas = renderBarcodeToCanvas(selectedVariant, barcodeType, 3, selectedLabelSize);
    const link = document.createElement("a");
    link.download = `barcode-${selectedVariant.sku}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Barcode berhasil diunduh!");
  }, [selectedVariant, barcodeType, renderBarcodeToCanvas, selectedLabelSize]);

  const handlePrintSingle = useCallback(() => {
    if (!selectedVariant) return;
    const canvas = renderBarcodeToCanvas(selectedVariant, barcodeType, 3, selectedLabelSize);
    const labelW = `${selectedLabelSize.widthMm}mm`;
    const labelH = `${selectedLabelSize.heightMm}mm`;
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Barcode ${selectedVariant.sku}</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; }
        img { max-width: 100%; }
        @media print {
          body { margin: 0; }
          @page { size: ${labelW} ${labelH}; margin: 0; }
        }
      </style></head><body>
        <img src="${canvas.toDataURL("image/png")}" />
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [selectedVariant, barcodeType, renderBarcodeToCanvas, selectedLabelSize]);

  const handleBluetoothPrintSingle = useCallback(async () => {
    if (!selectedVariant) return;
    setBtPrinting(true);
    try {
      const canvas = renderBarcodeToCanvas(selectedVariant, barcodeType, 3, selectedLabelSize);
      const commands = buildBarcodeLabelCommands(canvas, "58");
      const config: PrinterConfig = { type: "bluetooth", target: "", paperWidth: "58" };
      await printReceipt(commands, config);
      toast.success("Label berhasil dicetak via Bluetooth!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mencetak via Bluetooth");
    } finally {
      setBtPrinting(false);
    }
  }, [selectedVariant, barcodeType, renderBarcodeToCanvas, selectedLabelSize]);

  const handleBatchPrint = useCallback(() => {
    if (selectedForPrint.size === 0) return;
    const qty = parseInt(printQty) || 1;
    const selected = variants.filter((v) => selectedForPrint.has(v.id));
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const labelW = `${selectedLabelSize.widthMm}mm`;
    const labelH = `${selectedLabelSize.heightMm}mm`;
    const images: string[] = [];
    for (const variant of selected) {
      const canvas = renderBarcodeToCanvas(variant, "barcode", 2, selectedLabelSize);
      const dataUrl = canvas.toDataURL("image/png");
      for (let i = 0; i < qty; i++) {
        images.push(dataUrl);
      }
    }

    printWindow.document.write(`
      <html><head><title>Batch Print Barcode</title>
      <style>
        body { margin: 0; padding: 8px; }
        .grid { display: flex; flex-wrap: wrap; gap: 4px; }
        .label { width: ${labelW}; height: ${labelH}; display: flex; align-items: center; justify-content: center; page-break-inside: avoid; }
        .label img { max-width: 100%; max-height: 100%; }
        @media print {
          body { margin: 0; padding: 2mm; }
          .label { width: ${labelW}; height: ${labelH}; }
        }
      </style></head><body>
        <div class="grid">
          ${images.map((src) => `<div class="label"><img src="${src}" /></div>`).join("")}
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [selectedForPrint, printQty, variants, renderBarcodeToCanvas, selectedLabelSize]);

  const handleBatchBluetoothPrint = useCallback(async () => {
    if (selectedForPrint.size === 0) return;
    setBtPrinting(true);
    try {
      const qty = parseInt(printQty) || 1;
      const selected = variants.filter((v) => selectedForPrint.has(v.id));
      const config: PrinterConfig = { type: "bluetooth", target: "", paperWidth: "58" };

      for (const variant of selected) {
        for (let i = 0; i < qty; i++) {
          const canvas = renderBarcodeToCanvas(variant, "barcode", 3, selectedLabelSize);
          const commands = buildBarcodeLabelCommands(canvas, "58");
          await printReceipt(commands, config);
          // Small delay between labels
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      toast.success(`${selected.length * qty} label berhasil dicetak via Bluetooth!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mencetak via Bluetooth");
    } finally {
      setBtPrinting(false);
    }
  }, [selectedForPrint, printQty, variants, renderBarcodeToCanvas, selectedLabelSize]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-fade-up flex justify-between items-center">
        <h2 className="text-sm font-semibold text-foreground">Barcode & QR Code</h2>
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
                    <tr className="border-b border-border bg-surface">
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
                          "border-b border-border transition-all duration-300 cursor-pointer",
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
              {/* Label size selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-dim uppercase tracking-wider">Ukuran Label</span>
                <Select
                  options={labelSizeOptions}
                  value={labelSizeId}
                  onChange={(e) => setLabelSizeId(e.target.value)}
                  className="w-36"
                />
              </div>

              {selectedVariant ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-6 rounded-xl bg-black/30 border border-border">
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
                    <Button variant="secondary" size="sm" className="flex-1" onClick={handleDownload}>
                      <Download size={13} />
                      Unduh
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handlePrintSingle}>
                      <Printer size={13} />
                      Cetak
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={handleBluetoothPrintSingle}
                    disabled={btPrinting}
                  >
                    <Bluetooth size={13} />
                    {btPrinting ? "Mencetak..." : "Cetak via Bluetooth"}
                  </Button>
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
            <div className="relative rounded-xl border-2 border-dashed border-border-strong bg-surface p-8 flex flex-col items-center justify-center gap-4">
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 size={18} className="text-accent" />
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
              onClick={handleBatchPrint}
            >
              <Printer size={15} />
              Cetak {selectedForPrint.size > 0 ? `(${selectedForPrint.size * (parseInt(printQty) || 1)} label)` : ""}
            </Button>
            <Button
              variant="secondary"
              disabled={selectedForPrint.size === 0 || btPrinting}
              onClick={handleBatchBluetoothPrint}
            >
              <Bluetooth size={15} />
              {btPrinting ? "Mencetak..." : "Bluetooth"}
            </Button>
            <Select
              options={labelSizeOptions}
              value={labelSizeId}
              onChange={(e) => setLabelSizeId(e.target.value)}
              className="w-36"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-card accent-emerald-500"
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
                        "border-b border-border transition-all duration-300 cursor-pointer",
                        selectedForPrint.has(variant.id)
                          ? "bg-accent/[0.04]"
                          : "hover:bg-white/[0.025]"
                      )}
                      onClick={() => togglePrintSelect(variant.id)}
                    >
                      <td className="px-3 md:px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-card accent-emerald-500"
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
