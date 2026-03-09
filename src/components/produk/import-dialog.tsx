"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { importProducts } from "@/lib/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  // Parse a CSV line respecting quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === "," || ch === ";") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]).map((h) => h.replace(/^\uFEFF/, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

// Map Indonesian column names to internal keys
const COLUMN_MAP: Record<string, string> = {
  "nama produk": "productName",
  "sku": "sku",
  "barcode": "barcode",
  "kategori": "category",
  "brand": "brand",
  "harga jual": "sellPrice",
  "harga beli": "buyPrice",
  "stok": "stock",
  "stok minimum": "minStock",
  "status": "status",
};

function normalizeRow(raw: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const lower = key.toLowerCase().trim();
    const mapped = COLUMN_MAP[lower];
    if (mapped) {
      normalized[mapped] = value;
    }
  }
  return normalized;
}

function validateRow(row: Record<string, string>): string | null {
  if (!row.productName) return "Nama Produk kosong";
  if (!row.sku) return "SKU kosong";
  if (!row.sellPrice || isNaN(Number(row.sellPrice))) return "Harga Jual tidak valid";
  if (!row.buyPrice || isNaN(Number(row.buyPrice))) return "Harga Beli tidak valid";
  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedRow {
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
  minStock: number;
  status: string;
  error?: string;
}

type ImportMode = "skip" | "update";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mode, setMode] = useState<ImportMode>("skip");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  function reset() {
    setStep("upload");
    setRows([]);
    setMode("skip");
    setImporting(false);
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rawRows = parseCSV(text);

      if (rawRows.length === 0) {
        toast.error("File CSV kosong atau format tidak valid");
        return;
      }

      const parsed: ParsedRow[] = rawRows.map((raw) => {
        const n = normalizeRow(raw);
        const error = validateRow(n);
        return {
          productName: n.productName || "",
          sku: n.sku || "",
          barcode: n.barcode || "",
          category: n.category || "",
          brand: n.brand || "",
          sellPrice: Number(n.sellPrice) || 0,
          buyPrice: Number(n.buyPrice) || 0,
          stock: Number(n.stock) || 0,
          minStock: Number(n.minStock) || 5,
          status: n.status || "aktif",
          error: error || undefined,
        };
      });

      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const validRows = rows.filter((r) => !r.error);
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimpor");
      return;
    }

    setImporting(true);
    try {
      const res = await importProducts(
        validRows.map((r) => ({
          productName: r.productName,
          sku: r.sku,
          barcode: r.barcode,
          category: r.category,
          brand: r.brand,
          sellPrice: r.sellPrice,
          buyPrice: r.buyPrice,
          stock: r.stock,
          minStock: r.minStock,
          status: r.status,
        })),
        mode
      );
      setResult(res);
      setStep("result");
      router.refresh();
      toast.success("Impor selesai!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengimpor data");
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.filter((r) => r.error).length;

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-3xl">
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>Impor Produk dari CSV</DialogTitle>
      </DialogHeader>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload file CSV dengan kolom: Nama Produk, SKU, Barcode, Kategori, Brand, Harga Jual, Harga Beli, Stok, Stok Minimum, Status
          </p>

          <Card
            className="border-dashed border-2 p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-surface transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} className="text-muted-dim" />
            <p className="text-sm text-muted-foreground">
              Klik untuk pilih file atau drag & drop
            </p>
            <p className="text-xs text-muted-dim">Format: .csv</p>
          </Card>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              {validCount > 0 && (
                <Badge variant="default">
                  <CheckCircle2 size={12} className="mr-1" />
                  {validCount} valid
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle size={12} className="mr-1" />
                  {errorCount} error
                </Badge>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-64 overflow-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">#</th>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Nama Produk</th>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">SKU</th>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Kategori</th>
                  <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">Harga Jual</th>
                  <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">Stok</th>
                  <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={row.error ? "bg-red-500/5" : ""}
                  >
                    <td className="px-2 py-1.5 text-muted-dim">{i + 1}</td>
                    <td className="px-2 py-1.5 text-foreground">
                      {row.productName}
                      {row.error && (
                        <span className="block text-[10px] text-red-400 mt-0.5">
                          {row.error}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground font-mono">{row.sku}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{row.category}</td>
                    <td className="px-2 py-1.5 text-right text-foreground">
                      {row.sellPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-1.5 text-right text-foreground">{row.stock}</td>
                    <td className="px-2 py-1.5">
                      <Badge variant={row.status === "aktif" ? "default" : "outline"}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mode selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Mode duplikat (SKU sama):</p>
            <div className="flex gap-2">
              <Button
                variant={mode === "skip" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("skip")}
              >
                Lewati duplikat
              </Button>
              <Button
                variant={mode === "update" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("update")}
              >
                Update berdasarkan SKU
              </Button>
            </div>
            <p className="text-xs text-muted-dim">
              {mode === "skip"
                ? "Produk dengan SKU yang sudah ada akan dilewati."
                : "Produk dengan SKU yang sudah ada akan diupdate harga dan stoknya."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={reset}>
              Kembali
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing ? "Mengimpor..." : `Impor ${validCount} Produk`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{result.created}</p>
              <p className="text-xs text-muted-foreground">Dibuat</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{result.updated}</p>
              <p className="text-xs text-muted-foreground">Diperbarui</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{result.skipped}</p>
              <p className="text-xs text-muted-foreground">Dilewati</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{result.errors}</p>
              <p className="text-xs text-muted-foreground">Error</p>
            </Card>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>Selesai</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
