"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { Printer, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import JsBarcode from "jsbarcode";

// Extend Window for print window with JsBarcode loaded via CDN
interface PrintWindow extends Window {
  JsBarcode?: typeof JsBarcode;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarcodeLabelVariant {
  id: string;
  productName: string;
  sku: string;
  barcode: string;
  sellPrice: number;
  color: string;
  size: string;
}

interface BarcodeLabelDialogProps {
  open: boolean;
  onClose: () => void;
  variants: BarcodeLabelVariant[];
}

// ---------------------------------------------------------------------------
// Label size config
// ---------------------------------------------------------------------------

type LabelSize = "small" | "medium" | "large";

const LABEL_CONFIG: Record<LabelSize, { cols: number; label: string; width: string }> = {
  small: { cols: 2, label: "Besar (2 per baris)", width: "48%" },
  medium: { cols: 3, label: "Sedang (3 per baris)", width: "31.5%" },
  large: { cols: 4, label: "Kecil (4 per baris)", width: "23.5%" },
};

const LABEL_SIZE_OPTIONS = [
  { label: LABEL_CONFIG.small.label, value: "small" },
  { label: LABEL_CONFIG.medium.label, value: "medium" },
  { label: LABEL_CONFIG.large.label, value: "large" },
];

// ---------------------------------------------------------------------------
// Single barcode SVG renderer
// ---------------------------------------------------------------------------

function BarcodeSVG({
  value,
  labelSize,
}: {
  value: string;
  labelSize: LabelSize;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const height = labelSize === "large" ? 30 : labelSize === "medium" ? 35 : 40;
        const fontSize = labelSize === "large" ? 10 : labelSize === "medium" ? 11 : 12;
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.2,
          height,
          displayValue: true,
          fontSize,
          margin: 2,
          textMargin: 2,
          background: "transparent",
        });
      } catch {
        // If barcode generation fails, SVG stays empty
      }
    }
  }, [value, labelSize]);

  return <svg ref={svgRef} className="w-full" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BarcodeLabelDialog({
  open,
  onClose,
  variants,
}: BarcodeLabelDialogProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");
  const [copies, setCopies] = useState<Record<string, number>>({});
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize copies to 1 for each variant when variants change
  useEffect(() => {
    if (variants.length > 0) {
      const initial: Record<string, number> = {};
      for (const v of variants) {
        initial[v.id] = copies[v.id] ?? 1;
      }
      setCopies(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  const getCopies = useCallback(
    (id: string) => copies[id] ?? 1,
    [copies]
  );

  const updateCopies = useCallback((id: string, val: number) => {
    setCopies((prev) => ({ ...prev, [id]: Math.max(1, Math.min(999, val)) }));
  }, []);

  // Build the flat list of labels (variant repeated by copy count)
  const labels: BarcodeLabelVariant[] = [];
  for (const v of variants) {
    const count = getCopies(v.id);
    for (let i = 0; i < count; i++) {
      labels.push(v);
    }
  }

  function handlePrint() {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank") as PrintWindow | null;
    if (!printWindow) return;

    // Clone the content and regenerate barcodes in the print window
    const config = LABEL_CONFIG[labelSize];

    let labelsHTML = "";
    for (const label of labels) {
      const barcodeValue = label.barcode || label.sku;
      const variantInfo =
        label.color !== "-" || label.size !== "Utama"
          ? `${label.color !== "-" ? label.color : ""}${label.color !== "-" && label.size !== "Utama" ? " / " : ""}${label.size !== "Utama" ? label.size : ""}`
          : "";

      labelsHTML += `
        <div class="label" style="width: ${config.width};">
          <div class="product-name">${label.productName}</div>
          ${variantInfo ? `<div class="variant-info">${variantInfo}</div>` : ""}
          <svg class="barcode" id="bc-${Math.random().toString(36).slice(2)}"></svg>
          <div class="price">${formatRupiah(label.sellPrice)}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Label Barcode</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            color: black;
          }
          .label-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 8px;
          }
          .label {
            border: 1px dashed #ccc;
            border-radius: 4px;
            padding: 6px 4px;
            text-align: center;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
          }
          .product-name {
            font-size: ${labelSize === "large" ? "8px" : labelSize === "medium" ? "9px" : "10px"};
            font-weight: 700;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            width: 100%;
          }
          .variant-info {
            font-size: ${labelSize === "large" ? "7px" : labelSize === "medium" ? "7.5px" : "8px"};
            color: #555;
            line-height: 1.2;
          }
          .barcode {
            width: 100%;
            max-height: ${labelSize === "large" ? "35px" : labelSize === "medium" ? "40px" : "50px"};
          }
          .price {
            font-size: ${labelSize === "large" ? "9px" : labelSize === "medium" ? "10px" : "12px"};
            font-weight: 700;
            margin-top: 1px;
          }
          @media print {
            body { margin: 0; }
            .label { border: 1px dashed #ccc; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">${labelsHTML}</div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
        <script>
          document.querySelectorAll('.barcode').forEach(function(svg) {
            // The barcode value is stored in a sibling approach, so we use a data attr
          });
        <\/script>
      </body>
      </html>
    `);

    // We need a different approach - embed barcode values as data attributes
    printWindow.document.close();

    // Wait for JsBarcode CDN to load, then generate barcodes
    printWindow.onload = () => {
      try {
        const svgs = printWindow.document.querySelectorAll(".barcode");
        let idx = 0;
        for (const label of labels) {
          const barcodeValue = label.barcode || label.sku;
          const svg = svgs[idx];
          if (svg && barcodeValue && printWindow.JsBarcode) {
            try {
              const height = labelSize === "large" ? 25 : labelSize === "medium" ? 30 : 40;
              const fontSize = labelSize === "large" ? 8 : labelSize === "medium" ? 9 : 10;
              printWindow.JsBarcode(svg, barcodeValue, {
                format: "CODE128",
                width: 1,
                height,
                displayValue: true,
                fontSize,
                margin: 1,
                textMargin: 1,
              });
            } catch {
              // Skip invalid barcodes
            }
          }
          idx++;
        }
      } catch {
        // Fallback: print without barcodes
      }
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  }

  if (variants.length === 0 && open) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Cetak Label Barcode</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8">
          <Printer size={28} className="mx-auto mb-2 opacity-10" />
          <p className="text-sm text-muted-foreground">
            Tidak ada varian yang dipilih untuk dicetak.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-4xl">
      <DialogClose onClose={onClose} />
      <DialogHeader>
        <DialogTitle>Cetak Label Barcode</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Settings row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="space-y-1.5 w-full sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">
              Ukuran Label
            </label>
            <Select
              options={LABEL_SIZE_OPTIONS}
              value={labelSize}
              onValueChange={(val) => setLabelSize(val as LabelSize)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Total: {labels.length} label
            </span>
            <Button onClick={handlePrint}>
              <Printer size={15} />
              Cetak
            </Button>
          </div>
        </div>

        {/* Per-variant copy settings */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Jumlah Salinan per Varian
          </p>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                    Barcode
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-center w-32">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-b-0 hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {v.productName}
                        </span>
                        {(v.color !== "-" || v.size !== "Utama") && (
                          <span className="text-[11px] text-muted-dim">
                            {v.color !== "-" ? v.color : ""}
                            {v.color !== "-" && v.size !== "Utama" ? " / " : ""}
                            {v.size !== "Utama" ? v.size : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-num text-muted-foreground hidden sm:table-cell">
                      {v.sku}
                    </td>
                    <td className="px-3 py-2 text-xs font-num text-muted-dim hidden sm:table-cell">
                      {v.barcode || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateCopies(v.id, getCopies(v.id) - 1)
                          }
                        >
                          <Minus size={12} />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          className="w-14 h-7 text-center text-xs"
                          value={getCopies(v.id)}
                          onChange={(e) =>
                            updateCopies(v.id, parseInt(e.target.value) || 1)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateCopies(v.id, getCopies(v.id) + 1)
                          }
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Pratinjau Label
          </p>
          <div
            ref={printRef}
            className="border border-border rounded-xl bg-white p-3 overflow-x-auto"
          >
            <div className="flex flex-wrap gap-1.5" style={{ minWidth: "400px" }}>
              {labels.map((label, idx) => {
                const barcodeValue = label.barcode || label.sku;
                const variantInfo =
                  label.color !== "-" || label.size !== "Utama"
                    ? `${label.color !== "-" ? label.color : ""}${label.color !== "-" && label.size !== "Utama" ? " / " : ""}${label.size !== "Utama" ? label.size : ""}`
                    : "";

                return (
                  <div
                    key={`${label.id}-${idx}`}
                    className="border border-dashed border-gray-300 rounded p-1.5 text-center flex flex-col items-center"
                    style={{ width: LABEL_CONFIG[labelSize].width }}
                  >
                    <p
                      className="text-black font-bold leading-tight line-clamp-2 w-full"
                      style={{
                        fontSize:
                          labelSize === "large"
                            ? "8px"
                            : labelSize === "medium"
                              ? "9px"
                              : "10px",
                      }}
                    >
                      {label.productName}
                    </p>
                    {variantInfo && (
                      <p
                        className="text-gray-500 leading-tight"
                        style={{
                          fontSize:
                            labelSize === "large"
                              ? "7px"
                              : labelSize === "medium"
                                ? "7.5px"
                                : "8px",
                        }}
                      >
                        {variantInfo}
                      </p>
                    )}
                    {barcodeValue && (
                      <BarcodeSVG
                        value={barcodeValue}
                        labelSize={labelSize}
                      />
                    )}
                    <p
                      className="text-black font-bold"
                      style={{
                        fontSize:
                          labelSize === "large"
                            ? "9px"
                            : labelSize === "medium"
                              ? "10px"
                              : "12px",
                      }}
                    >
                      {formatRupiah(label.sellPrice)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
