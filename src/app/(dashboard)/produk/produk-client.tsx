"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { formatRupiah, cn } from "@/lib/utils";
import { VariantTable } from "@/components/produk/variant-table";
import { BarcodeScannerDialog } from "@/components/pos/barcode-scanner";
import {
  BarcodeLabelDialog,
  type BarcodeLabelVariant,
} from "@/components/produk/barcode-label-dialog";
import {
  VariantBuilder,
  type VariantRow,
} from "@/components/produk/variant-builder";
import { updateProduct, createProduct, getProducts, getAllVariantsFlat } from "@/lib/actions/products";
import { exportToCSV } from "@/lib/export-csv";
import { ImportDialog } from "@/components/produk/import-dialog";
import { StokTab } from "./stok-tab";
import { KategoriTab } from "./kategori-tab";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  Eye,
  ChevronDown,
  ScanLine,
  PackageOpen,
  X,
  Download,
  Upload,
  Printer,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types from DB
// ---------------------------------------------------------------------------

interface DBVariant {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  size: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  status: "aktif" | "nonaktif";
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface DBSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  status: string;
}

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  supplierId: string | null;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  baseCost: number;
  isBundle: boolean;
  status: "aktif" | "nonaktif";
  category: DBCategory | null;
  variants: DBVariant[];
  bundleItems?: {
    id: string;
    bundleId: string;
    componentVariantId: string;
    quantity: number;
    componentVariant?: {
      id: string;
      color: string;
      size: string;
      stock: number;
      product?: { name: string };
    };
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTotalStock(product: DBProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

function getUniqueColors(product: DBProduct): string[] {
  return [...new Set(product.variants.map((v) => v.color))];
}

function getUniqueSizes(product: DBProduct): string[] {
  return [...new Set(product.variants.map((v) => v.size))];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProdukClientProps {
  initialProducts: DBProduct[];
  totalProducts?: number;
  categories: DBCategory[];
  suppliers: DBSupplier[];
  initialVariants: any[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProdukClient({ initialProducts, totalProducts = 0, categories, suppliers, initialVariants }: ProdukClientProps) {
  const router = useRouter();

  const [products, setProducts] = useState<DBProduct[]>(initialProducts);
  const [offset, setOffset] = useState(initialProducts.length);
  const [loadingMore, setLoadingMore] = useState(false);

  const [mainTab, setMainTab] = useState("katalog");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<DBProduct | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Barcode label state
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelVariants, setLabelVariants] = useState<BarcodeLabelVariant[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Form state
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImagePreview, setFormImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formBaseCost, setFormBaseCost] = useState("");

  // Product type state: "single" | "variant" | "bundle"
  const [productType, setProductType] = useState<"single" | "variant" | "bundle">("single");
  const [formColors, setFormColors] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<VariantRow[]>([]);

  // Single variant state
  const [formSingleBarcode, setFormSingleBarcode] = useState("");
  const [formSingleStock, setFormSingleStock] = useState("");
  const [singleScanning, setSingleScanning] = useState(false);

  // Bundle state
  const [bundleComponents, setBundleComponents] = useState<{ variantId: string; variantLabel: string; quantity: number }[]>([]);
  const [bundleBarcode, setBundleBarcode] = useState("");
  const [bundleSearchQuery, setBundleSearchQuery] = useState("");
  const [bundleSearchResults, setBundleSearchResults] = useState<any[]>([]);
  const [bundleSearching, setBundleSearching] = useState(false);
  const [bundleScanning, setBundleScanning] = useState(false);

  // Build category tabs dynamically
  const mainTabOptions = [
    { label: "Katalog", value: "katalog" },
    { label: "Stok", value: "stok" },
    { label: "Kategori", value: "kategori" },
  ];

  const categoryTabs = [
    { label: "Semua", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];


  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const filtered = products.filter((p) => {
    const matchCat = category === "all" || p.categoryId === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const hasMoreData = offset < totalProducts;

  async function handleLoadMore() {
    try {
      setLoadingMore(true);
      const result = await getProducts({ limit: 10, offset });
      if (result.data && result.data.length > 0) {
        setProducts(prev => [...prev, ...result.data as DBProduct[]]);
        setOffset(prev => prev + result.data.length);
      }
    } catch (e) {
      toast.error("Gagal mengambil lebih banyak produk");
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  function openDetail(product: DBProduct) {
    setSelectedProduct(product);
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelectedProduct(null);
  }

  // Barcode label helpers
  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function toggleAllProducts() {
    if (selectedProductIds.size === filtered.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filtered.map((p) => p.id)));
    }
  }

  function openLabelDialogForSelected() {
    const variants: BarcodeLabelVariant[] = [];
    for (const product of filtered) {
      if (selectedProductIds.has(product.id)) {
        for (const v of product.variants) {
          variants.push({
            id: v.id,
            productName: product.name,
            sku: v.sku,
            barcode: v.barcode,
            sellPrice: v.sellPrice,
            color: v.color,
            size: v.size,
          });
        }
      }
    }
    setLabelVariants(variants);
    setLabelDialogOpen(true);
  }

  function openLabelDialogForProduct(product: DBProduct) {
    const variants: BarcodeLabelVariant[] = product.variants.map((v) => ({
      id: v.id,
      productName: product.name,
      sku: v.sku,
      barcode: v.barcode,
      sellPrice: v.sellPrice,
      color: v.color,
      size: v.size,
    }));
    setLabelVariants(variants);
    setLabelDialogOpen(true);
  }

  function resetForm() {
    setFormName("");
    setFormBrand("");
    setFormCategoryId("");
    setFormSupplierId("");
    setFormDescription("");
    setFormImageUrl("");
    setFormImagePreview("");
    setFormBasePrice("");
    setFormBaseCost("");
    setProductType("single");
    setFormColors([]);
    setFormSizes([]);
    setFormVariants([]);
    setFormSingleBarcode("");
    setFormSingleStock("");
    setBundleComponents([]);
    setBundleBarcode("");
    setBundleSearchQuery("");
    setBundleSearchResults([]);
    setEditProduct(null);
  }

  function openForm(product?: DBProduct) {
    if (product) {
      setEditProduct(product);
      setFormName(product.name);
      setFormBrand(product.brand);
      setFormCategoryId(product.categoryId);
      setFormSupplierId(product.supplierId || "");
      setFormDescription(product.description || "");
      setFormImageUrl(product.imageUrl || "");
      setFormImagePreview(product.imageUrl || "");
      setFormBasePrice(String(product.basePrice));
      setFormBaseCost(String(product.baseCost));

      // Detect product type
      if (product.isBundle && (product as any).bundleItems?.length > 0) {
        setProductType("bundle");
        setBundleComponents(
          ((product as any).bundleItems || []).map((bi: any) => ({
            variantId: bi.componentVariantId || bi.componentVariant?.id,
            variantLabel: bi.componentVariant
              ? `${bi.componentVariant.product?.name || ""} — ${bi.componentVariant.color}/${bi.componentVariant.size}`
              : bi.componentVariantId,
            quantity: bi.quantity,
          }))
        );
        setBundleBarcode(product.variants?.[0]?.barcode || "");
      } else if (product.variants && product.variants.length > 1) {
        setProductType("variant");
        setBundleComponents([]);
        setBundleBarcode("");
      } else {
        setProductType("single");
        setBundleComponents([]);
        setBundleBarcode("");
      }
      setFormColors([]);
      setFormSizes([]);
      setFormVariants([]);
      setFormSingleBarcode("");
      setFormSingleStock("");
    } else {
      resetForm();
    }
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editProduct) {
        const bundleComponentsToSave = productType === "bundle"
          ? bundleComponents.map((c) => ({
            componentVariantId: c.variantId,
            quantity: c.quantity,
          }))
          : undefined;

        await updateProduct(editProduct.id, {
          name: formName,
          brand: formBrand,
          categoryId: formCategoryId,
          supplierId: formSupplierId || undefined,
          description: formDescription,
          imageUrl: formImageUrl || undefined,
          basePrice: parseInt(formBasePrice) || 0,
          baseCost: parseInt(formBaseCost) || 0,
          isBundle: productType === "bundle",
        }, bundleComponentsToSave);
        toast.success("Produk berhasil diperbarui");
      } else {
        let variantsToSave;
        let isBundle = false;
        let bundleComponentsToSave: { componentVariantId: string; quantity: number }[] | undefined;

        if (productType === "variant") {
          variantsToSave = formVariants.map((v) => ({
            sku: v.sku,
            barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            color: v.color,
            size: v.size,
            stock: v.stock,
            minStock: 5,
            buyPrice: v.buyPrice,
            sellPrice: v.sellPrice,
          }));
        } else if (productType === "bundle") {
          isBundle = true;
          variantsToSave = [{
            sku: `BDL-${Date.now().toString().slice(-6)}`,
            barcode: bundleBarcode.trim() !== "" ? bundleBarcode.trim() : `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            color: "-",
            size: "Paket",
            stock: 0,
            minStock: 0,
            buyPrice: parseInt(formBaseCost) || 0,
            sellPrice: parseInt(formBasePrice) || 0,
          }];
          bundleComponentsToSave = bundleComponents.map((c) => ({
            componentVariantId: c.variantId,
            quantity: c.quantity,
          }));
        } else {
          variantsToSave = [{
            sku: `PRD-${Date.now().toString().slice(-6)}`,
            barcode: formSingleBarcode.trim() !== "" ? formSingleBarcode.trim() : `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            color: "-",
            size: "Utama",
            stock: parseInt(formSingleStock) || 0,
            minStock: 5,
            buyPrice: parseInt(formBaseCost) || 0,
            sellPrice: parseInt(formBasePrice) || 0,
          }];
        }

        await createProduct({
          name: formName,
          brand: formBrand,
          categoryId: formCategoryId,
          supplierId: formSupplierId || undefined,
          description: formDescription,
          imageUrl: formImageUrl || undefined,
          basePrice: parseInt(formBasePrice) || 0,
          baseCost: parseInt(formBaseCost) || 0,
          isBundle,
          variants: variantsToSave.length > 0 ? variantsToSave : undefined,
          bundleComponents: bundleComponentsToSave,
        });
        toast.success(isBundle ? "Produk paket berhasil ditambahkan" : "Produk berhasil ditambahkan");
      }

      setFormOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(editProduct ? "Gagal memperbarui produk" : "Gagal menambahkan produk");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: DBProduct) {
    try {
      await updateProduct(product.id, { status: "nonaktif" });
      toast.success(`Produk "${product.name}" dinonaktifkan`);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menonaktifkan produk");
      console.error(err);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Katalog &amp; Stok
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola data produk beserta ketersediaan stok
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mainTab === "katalog" && (
            <>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    const variants = await getAllVariantsFlat();
                    exportToCSV(
                      variants.map((v) => ({
                        productName: v.productName,
                        sku: v.sku,
                        barcode: v.barcode,
                        category: v.categoryName,
                        brand: v.brand,
                        sellPrice: v.sellPrice,
                        buyPrice: v.buyPrice,
                        stock: v.stock,
                        minStock: v.minStock,
                        status: v.status,
                      })),
                      "produk",
                      [
                        { key: "productName", label: "Nama Produk" },
                        { key: "sku", label: "SKU" },
                        { key: "barcode", label: "Barcode" },
                        { key: "category", label: "Kategori" },
                        { key: "brand", label: "Brand" },
                        { key: "sellPrice", label: "Harga Jual" },
                        { key: "buyPrice", label: "Harga Beli" },
                        { key: "stock", label: "Stok" },
                        { key: "minStock", label: "Stok Minimum" },
                        { key: "status", label: "Status" },
                      ]
                    );
                    toast.success("CSV berhasil diekspor");
                  } catch {
                    toast.error("Gagal mengekspor CSV");
                  }
                }}
              >
                <Download size={15} />
                Ekspor CSV
              </Button>
              <Button variant="ghost" onClick={() => setImportOpen(true)}>
                <Upload size={15} />
                Impor CSV
              </Button>
              {selectedProductIds.size > 0 && (
                <Button variant="secondary" onClick={openLabelDialogForSelected}>
                  <Printer size={15} />
                  Cetak Label ({selectedProductIds.size})
                </Button>
              )}
              <Button onClick={() => openForm()}>
                <Plus size={15} />
                Tambah Produk
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="animate-fade-up">
        <Tabs tabs={mainTabOptions} value={mainTab} onChange={setMainTab} className="w-fit" />
      </div>

      {mainTab === "katalog" && (
        <>
          {/* Filters */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <Tabs tabs={categoryTabs} value={category} onChange={setCategory} />
            <Input
              placeholder="Cari produk..."
              icon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-[220px]"
            />
          </div>

          {/* Product Table */}
          <Card
            className="overflow-hidden animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedProductIds.size === filtered.length}
                        onChange={toggleAllProducts}
                        className="w-3.5 h-3.5 rounded border-border accent-accent cursor-pointer"
                      />
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                      Kategori
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Harga Dasar
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Varian
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Total Stok
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
                    >
                      {/* Checkbox */}
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-3.5 h-3.5 rounded border-border accent-accent cursor-pointer"
                        />
                      </td>

                      {/* Produk */}
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <Package size={14} className="text-muted-dim" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {product.name}
                            </span>
                            <span className="text-[11px] text-muted-dim">
                              {product.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {product.category?.name ?? "-"}
                      </td>

                      {/* Harga Dasar */}
                      <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                        {formatRupiah(product.basePrice)}
                      </td>

                      {/* Varian */}
                      <td className="px-3 md:px-4 py-3">
                        <span className="text-xs font-num text-muted-foreground">
                          {product.variants.length}
                        </span>
                      </td>

                      {/* Total Stok */}
                      <td className="px-3 md:px-4 py-3 text-xs font-num text-foreground">
                        {getTotalStock(product)}
                      </td>

                      {/* Status */}
                      <td className="px-3 md:px-4 py-3 hidden lg:table-cell">
                        <Badge
                          variant={
                            product.status === "aktif" ? "success" : "outline"
                          }
                        >
                          {product.status === "aktif" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>

                      {/* Aksi */}
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(product)}
                          >
                            <Eye size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(product)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2
                              size={13}
                              className="text-destructive/60"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLabelDialogForProduct(product)}
                            title="Cetak Label"
                          >
                            <Printer size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        <Package
                          size={28}
                          className="mx-auto mb-2 opacity-10"
                        />
                        Tidak ada produk ditemukan
                      </td>
                    </tr>
                  )}
                  {hasMoreData && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="w-full sm:w-auto"
                        >
                          {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Product Detail Dialog */}
          <Dialog
            open={detailOpen}
            onClose={closeDetail}
            className="max-w-2xl"
          >
            <DialogClose onClose={closeDetail} />
            <DialogHeader>
              <DialogTitle>Detail Produk</DialogTitle>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-5">
                {/* Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <Package size={18} className="text-muted-dim" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-[11px] text-muted-dim">
                        {selectedProduct.brand} &middot;{" "}
                        {selectedProduct.category?.name ?? "-"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Badge
                        variant={
                          selectedProduct.status === "aktif"
                            ? "success"
                            : "outline"
                        }
                      >
                        {selectedProduct.status === "aktif"
                          ? "Aktif"
                          : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {selectedProduct.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-[10px] text-muted-dim uppercase tracking-wider mb-1">
                        Harga Dasar
                      </p>
                      <p className="text-xs font-semibold font-num text-foreground">
                        {formatRupiah(selectedProduct.basePrice)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-[10px] text-muted-dim uppercase tracking-wider mb-1">
                        COGS
                      </p>
                      <p className="text-xs font-semibold font-num text-foreground">
                        {formatRupiah(selectedProduct.baseCost)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-[10px] text-muted-dim uppercase tracking-wider mb-1">
                        Varian
                      </p>
                      <p className="text-xs font-semibold font-num text-foreground">
                        {selectedProduct.variants.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-[10px] text-muted-dim uppercase tracking-wider mb-1">
                        Total Stok
                      </p>
                      <p className="text-xs font-semibold font-num text-foreground">
                        {getTotalStock(selectedProduct)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-muted-dim mr-1">
                      Warna:
                    </span>
                    {getUniqueColors(selectedProduct).map((color) => (
                      <span
                        key={color}
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface border border-border text-muted-foreground"
                      >
                        {color}
                      </span>
                    ))}
                    <span className="text-[11px] text-muted-dim ml-2 mr-1">
                      Ukuran:
                    </span>
                    {getUniqueSizes(selectedProduct).map((size) => (
                      <span
                        key={size}
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface border border-border text-muted-foreground"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Variant Table */}
                <VariantTable variants={selectedProduct.variants} />
              </div>
            )}
          </Dialog>

          {/* Add/Edit Product Dialog */}
          <Dialog
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              resetForm();
            }}
            className="max-w-2xl"
          >
            <DialogClose
              onClose={() => {
                setFormOpen(false);
                resetForm();
              }}
            />
            <DialogHeader>
              <DialogTitle>
                {editProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
              {/* Nama & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nama Produk
                  </label>
                  <Input
                    placeholder="Masukkan nama produk"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Brand
                  </label>
                  <Input
                    placeholder="Masukkan brand"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Foto Produk */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Foto Produk (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  {formImagePreview ? (
                    <div className="relative w-20 h-20 rounded-xl border border-border overflow-hidden flex-shrink-0">
                      <img src={formImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setFormImageUrl(""); setFormImagePreview(""); }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      "w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer flex-shrink-0",
                      "hover:border-accent/40 hover:bg-accent/5 transition-colors",
                      imageUploading && "pointer-events-none opacity-50"
                    )}>
                      {imageUploading ? (
                        <Loader2 size={20} className="text-muted-dim animate-spin" />
                      ) : (
                        <ImagePlus size={20} className="text-muted-dim" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = "";

                          // Show local preview immediately
                          const localUrl = URL.createObjectURL(file);
                          setFormImagePreview(localUrl);
                          setImageUploading(true);

                          try {
                            // Compress: resize 400x400 + WebP 75%
                            const compressed = await compressImage(file);

                            // Upload to Supabase Storage
                            const formData = new FormData();
                            formData.append("file", compressed, "product.webp");

                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                            const json = await res.json();

                            if (!res.ok) throw new Error(json.error || "Upload gagal");

                            setFormImageUrl(json.url);
                            setFormImagePreview(json.url);
                            URL.revokeObjectURL(localUrl);
                            toast.success("Foto berhasil diupload");
                          } catch (err) {
                            console.error(err);
                            toast.error("Gagal upload foto");
                            setFormImagePreview("");
                            URL.revokeObjectURL(localUrl);
                          } finally {
                            setImageUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-muted-dim leading-relaxed">
                    Otomatis dikompres ke WebP 400x400px.<br />
                    Max ~20KB per foto.
                  </p>
                </div>
              </div>

              {/* Category & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Kategori
                  </label>
                  <Select
                    options={categoryOptions}
                    placeholder="Pilih kategori"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Supplier (Opsional)
                  </label>
                  <Select
                    options={[{ label: "Tanpa Supplier", value: "" }, ...supplierOptions]}
                    placeholder="Pilih supplier"
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Deskripsi
                </label>
                <Input
                  placeholder="Masukkan deskripsi produk"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Harga Jual (Rp)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Harga Beli / COGS (Rp)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formBaseCost}
                    onChange={(e) => setFormBaseCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Product Type Selector - only show for new products */}
              {!editProduct && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Jenis Produk
                    </label>
                    <div className="flex gap-2">
                      {[
                        { key: "single" as const, label: "Tunggal", icon: <Package size={14} /> },
                        { key: "variant" as const, label: "Multi Varian", icon: <ChevronDown size={14} /> },
                        { key: "bundle" as const, label: "Paket / Bundle", icon: <PackageOpen size={14} /> },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setProductType(opt.key)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                            productType === opt.key
                              ? "bg-accent text-white shadow-sm"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Variant Builder (Multi Varian) */}
                  {productType === "variant" && (
                    <div className="space-y-2 animate-fade-in">
                      <VariantBuilder
                        colors={formColors}
                        sizes={formSizes}
                        onColorsChange={setFormColors}
                        onSizesChange={setFormSizes}
                        onVariantsChange={setFormVariants}
                      />
                    </div>
                  )}

                  {/* Single Product Inputs */}
                  {productType === "single" && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Stok Awal
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formSingleStock}
                          onChange={(e) => setFormSingleStock(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Barcode <span className="text-muted-dim font-normal">(Opsional)</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Scan/Ketik Barcode"
                            value={formSingleBarcode}
                            onChange={(e) => setFormSingleBarcode(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setSingleScanning(true)}
                          >
                            <ScanLine size={16} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bundle Builder */}
                  {productType === "bundle" && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Barcode Paket <span className="text-muted-dim font-normal">(Opsional)</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Scan/Ketik Barcode Paket"
                            value={bundleBarcode}
                            onChange={(e) => setBundleBarcode(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setBundleScanning(true)}
                          >
                            <ScanLine size={16} className="text-muted-foreground" />
                          </Button>
                        </div>
                      </div>

                      {/* Component Search */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Cari Produk Komponen
                        </label>
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="Ketik nama produk untuk dicari..."
                            value={bundleSearchQuery}
                            onChange={(e) => setBundleSearchQuery(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (!bundleSearchQuery.trim()) return;
                                setBundleSearching(true);
                                try {
                                  const variants = await getAllVariantsFlat();
                                  const filtered = variants.filter((v: any) =>
                                    v.productName.toLowerCase().includes(bundleSearchQuery.toLowerCase()) ||
                                    v.sku.toLowerCase().includes(bundleSearchQuery.toLowerCase()) ||
                                    v.barcode.toLowerCase().includes(bundleSearchQuery.toLowerCase())
                                  );
                                  setBundleSearchResults(filtered.slice(0, 10));
                                } catch {
                                  toast.error("Gagal mencari produk");
                                } finally {
                                  setBundleSearching(false);
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            disabled={bundleSearching}
                            onClick={async () => {
                              if (!bundleSearchQuery.trim()) return;
                              setBundleSearching(true);
                              try {
                                const variants = await getAllVariantsFlat();
                                const filtered = variants.filter((v: any) =>
                                  v.productName.toLowerCase().includes(bundleSearchQuery.toLowerCase()) ||
                                  v.sku.toLowerCase().includes(bundleSearchQuery.toLowerCase()) ||
                                  v.barcode.toLowerCase().includes(bundleSearchQuery.toLowerCase())
                                );
                                setBundleSearchResults(filtered.slice(0, 10));
                              } catch {
                                toast.error("Gagal mencari produk");
                              } finally {
                                setBundleSearching(false);
                              }
                            }}
                          >
                            <Search size={16} className="text-muted-foreground" />
                          </Button>
                        </div>

                        {/* Search Results Dropdown */}
                        {bundleSearchResults.length > 0 && (
                          <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-background">
                            {bundleSearchResults.map((v: any) => {
                              const alreadyAdded = bundleComponents.some((c) => c.variantId === v.id);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() => {
                                    setBundleComponents((prev) => [
                                      ...prev,
                                      {
                                        variantId: v.id,
                                        variantLabel: `${v.productName} — ${v.color}/${v.size} (Stok: ${v.stock})`,
                                        quantity: 1,
                                      },
                                    ]);
                                    setBundleSearchResults([]);
                                    setBundleSearchQuery("");
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                                    alreadyAdded && "opacity-40 cursor-not-allowed"
                                  )}
                                >
                                  <span className="font-medium">{v.productName}</span>
                                  <span className="text-muted-dim"> — {v.color}/{v.size}</span>
                                  <span className="text-muted-dim ml-1">(Stok: {v.stock})</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Selected Components Table */}
                      {bundleComponents.length > 0 && (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/30 text-muted-foreground">
                                <th className="text-left px-3 py-1.5 font-medium">Komponen</th>
                                <th className="text-center px-2 py-1.5 font-medium w-20">Qty</th>
                                <th className="w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {bundleComponents.map((comp, idx) => (
                                <tr key={comp.variantId} className="border-t border-border">
                                  <td className="px-3 py-2 text-foreground">{comp.variantLabel}</td>
                                  <td className="px-2 py-1">
                                    <Input
                                      type="number"
                                      min={1}
                                      className="text-center h-7 text-xs"
                                      value={comp.quantity}
                                      onChange={(e) => {
                                        setBundleComponents((prev) =>
                                          prev.map((c, i) =>
                                            i === idx ? { ...c, quantity: parseInt(e.target.value) || 1 } : c
                                          )
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setBundleComponents((prev) => prev.filter((_, i) => i !== idx))
                                      }
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {bundleComponents.length === 0 && (
                        <div className="text-center py-6 text-muted-dim text-xs border border-dashed border-border rounded-lg">
                          <PackageOpen size={24} className="mx-auto mb-2 opacity-30" />
                          Cari dan tambahkan produk komponen di atas
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Menyimpan..."
                    : editProduct
                      ? "Simpan Perubahan"
                      : "Simpan Produk"}
                </Button>
              </div>
            </form>
          </Dialog>
        </>
      )}

      {mainTab === "stok" && (
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <StokTab initialVariants={initialVariants} />
        </div>
      )}
      {/* Kategori Tab */}
      {mainTab === "kategori" && (
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <KategoriTab categories={categories as any} />
        </div>
      )}
      {/* Single Scan Dialog */}
      <BarcodeScannerDialog
        open={singleScanning}
        onClose={() => setSingleScanning(false)}
        onScan={(barcode) => {
          setFormSingleBarcode(barcode);
          setSingleScanning(false);
        }}
        lastResult={null}
      />
      {/* Bundle Scan Dialog */}
      <BarcodeScannerDialog
        open={bundleScanning}
        onClose={() => setBundleScanning(false)}
        onScan={(barcode) => {
          setBundleBarcode(barcode);
          setBundleScanning(false);
        }}
        lastResult={null}
      />
      {/* Import CSV Dialog */}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      {/* Barcode Label Dialog */}
      <BarcodeLabelDialog
        open={labelDialogOpen}
        onClose={() => {
          setLabelDialogOpen(false);
          setLabelVariants([]);
        }}
        variants={labelVariants}
      />
    </div>
  );
}
