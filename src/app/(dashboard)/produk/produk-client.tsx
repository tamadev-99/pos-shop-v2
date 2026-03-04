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
import { formatRupiah } from "@/lib/utils";
import { VariantTable } from "@/components/produk/variant-table";
import {
  VariantBuilder,
  type VariantRow,
} from "@/components/produk/variant-builder";
import { updateProduct, createProduct, getProducts } from "@/lib/actions/products";
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
} from "lucide-react";
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
  basePrice: number;
  baseCost: number;
  status: "aktif" | "nonaktif";
  category: DBCategory | null;
  variants: DBVariant[];
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

  // Form state
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formBaseCost, setFormBaseCost] = useState("");

  // Variant builder state
  const [formColors, setFormColors] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<VariantRow[]>([]);

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

  function resetForm() {
    setFormName("");
    setFormBrand("");
    setFormCategoryId("");
    setFormSupplierId("");
    setFormDescription("");
    setFormBasePrice("");
    setFormBaseCost("");
    setFormColors([]);
    setFormSizes([]);
    setFormVariants([]);
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
      setFormBasePrice(String(product.basePrice));
      setFormBaseCost(String(product.baseCost));
      setFormColors([]);
      setFormSizes([]);
      setFormVariants([]);
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
        await updateProduct(editProduct.id, {
          name: formName,
          brand: formBrand,
          categoryId: formCategoryId,
          supplierId: formSupplierId || undefined,
          description: formDescription,
          basePrice: parseInt(formBasePrice) || 0,
          baseCost: parseInt(formBaseCost) || 0,
        });
        toast.success("Produk berhasil diperbarui");
      } else {
        const variants = formVariants.map((v) => ({
          sku: v.sku,
          barcode: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          color: v.color,
          size: v.size,
          stock: v.stock,
          minStock: 5,
          buyPrice: v.buyPrice,
          sellPrice: v.sellPrice,
        }));

        await createProduct({
          name: formName,
          brand: formBrand,
          categoryId: formCategoryId,
          supplierId: formSupplierId || undefined,
          description: formDescription,
          basePrice: parseInt(formBasePrice) || 0,
          baseCost: parseInt(formBaseCost) || 0,
          variants: variants.length > 0 ? variants : undefined,
        });
        toast.success("Produk berhasil ditambahkan");
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
            <Button onClick={() => openForm()}>
              <Plus size={15} />
              Tambah Produk
            </Button>
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
                      {/* Produk */}
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <Package size={14} className="text-muted-dim" />
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
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
                      <td colSpan={7} className="p-4 text-center">
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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Variant Builder - only show for new products */}
              {!editProduct && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ChevronDown size={14} className="text-muted-dim" />
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Varian Produk
                    </label>
                  </div>
                  <VariantBuilder
                    colors={formColors}
                    sizes={formSizes}
                    onColorsChange={setFormColors}
                    onSizesChange={setFormSizes}
                    onVariantsChange={setFormVariants}
                  />
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
    </div>
  );
}
