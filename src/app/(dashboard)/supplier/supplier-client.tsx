"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  Eye,
  Package,
  Pencil,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  totalOrders: number;
  totalSpent: number;
  status: "aktif" | "nonaktif";
  joinDate: string;
  createdAt: Date;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
}

interface SupplierClientProps {
  initialSuppliers: Supplier[];
  categories?: Category[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SupplierClient({
  initialSuppliers,
  categories: categoryOptions = [],
}: SupplierClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [editSupplierData, setEditSupplierData] = useState<Supplier | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const suppliers = initialSuppliers;

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  // Computed stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "aktif").length;
  const totalSpentAll = suppliers.reduce((s, c) => s + c.totalSpent, 0);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleAddSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const categoryId = formData.get("categoryId") as string;

    if (!name || !contactPerson || !phone) {
      toast.error("Nama, contact person, dan telepon wajib diisi");
      setSubmitting(false);
      return;
    }

    try {
      await createSupplier({
        name,
        contactPerson,
        phone,
        email: email || undefined,
        address: address || undefined,
        categoryIds: categoryId ? [categoryId] : undefined,
      });
      toast.success("Supplier berhasil ditambahkan");
      setAddOpen(false);
      form.reset();
      router.refresh();
    } catch {
      toast.error("Gagal menambahkan supplier");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editSupplierData) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const status = formData.get("status") as "aktif" | "nonaktif";

    if (!name || !contactPerson || !phone) {
      toast.error("Nama, contact person, dan telepon wajib diisi");
      setSubmitting(false);
      return;
    }

    try {
      await updateSupplier(editSupplierData.id, {
        name,
        contactPerson,
        phone,
        email: email || undefined,
        address: address || undefined,
        status,
      });
      toast.success("Supplier berhasil diperbarui");
      setEditOpen(false);
      setEditSupplierData(null);
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui supplier");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(supplier: Supplier) {
    setEditSupplierData(supplier);
    setEditOpen(true);
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Supplier
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola data supplier dan pembelian
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          Tambah Supplier
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            <Building2 size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Supplier
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(totalSuppliers)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="success"
          style={{ animationDelay: "60ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <Package size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Supplier Aktif
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(activeSuppliers)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up col-span-2 sm:col-span-1"
          hover
          glow="accent"
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(59,130,246,0.25)]">
            <Building2 size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Pembelian
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(totalSpentAll)}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
        <Input
          placeholder="Cari nama supplier atau contact person..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[300px]"
        />
      </div>

      {/* Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Contact Person
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Telepon
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Kategori
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Total PO
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <Building2 size={14} className="text-muted-dim" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {supplier.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {supplier.contactPerson}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                    {supplier.phone}
                  </td>
                  <td className="px-3 md:px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.map((cat) => (
                        <Badge key={cat} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                      {supplier.categories.length === 0 && (
                        <span className="text-xs text-muted-dim">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                    {formatNumber(supplier.totalOrders)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge
                      variant={
                        supplier.status === "aktif" ? "success" : "destructive"
                      }
                    >
                      {supplier.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailSupplier(supplier)}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(supplier)}
                      >
                        <Pencil size={13} />
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
                    <Building2 size={28} className="mx-auto mb-2 opacity-10" />
                    Tidak ada supplier ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplier Detail Dialog */}
      <Dialog
        open={detailSupplier !== null}
        onClose={() => setDetailSupplier(null)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setDetailSupplier(null)} />
        <DialogHeader>
          <DialogTitle>Detail Supplier</DialogTitle>
        </DialogHeader>

        {detailSupplier && (
          <div className="space-y-5">
            {/* Supplier Info */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  {detailSupplier.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailSupplier.contactPerson}
                </p>
                <Badge
                  variant={
                    detailSupplier.status === "aktif"
                      ? "success"
                      : "destructive"
                  }
                  className="mt-1"
                >
                  {detailSupplier.status === "aktif" ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-muted-dim" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Telepon
                  </p>
                  <p className="text-xs text-foreground font-num">
                    {detailSupplier.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-muted-dim" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-xs text-foreground">
                    {detailSupplier.email || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-muted-dim" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                    Alamat
                  </p>
                  <p className="text-xs text-foreground">
                    {detailSupplier.address || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Total PO
                </p>
                <p className="text-sm font-bold font-num text-foreground mt-1">
                  {formatNumber(detailSupplier.totalOrders)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Total Belanja
                </p>
                <p className="text-sm font-bold font-num text-foreground mt-1">
                  {formatRupiah(detailSupplier.totalSpent)}
                </p>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Kategori Produk
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detailSupplier.categories.map((cat) => (
                  <Badge key={cat} variant="outline">
                    {cat}
                  </Badge>
                ))}
                {detailSupplier.categories.length === 0 && (
                  <span className="text-xs text-muted-dim">
                    Belum ada kategori
                  </span>
                )}
              </div>
            </div>

            {/* Join Date */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                Bergabung Sejak
              </p>
              <p className="text-xs font-num text-foreground mt-1">
                {detailSupplier.joinDate}
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setAddOpen(false)} />
        <DialogHeader>
          <DialogTitle>Tambah Supplier Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddSupplier} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Perusahaan
            </label>
            <Input
              name="name"
              placeholder="Masukkan nama perusahaan"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Contact Person
              </label>
              <Input
                name="contactPerson"
                placeholder="Nama kontak"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Telepon
              </label>
              <Input name="phone" placeholder="08xxxxxxxxxx" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              name="email"
              type="email"
              placeholder="email@perusahaan.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Alamat
            </label>
            <Input name="address" placeholder="Masukkan alamat lengkap" />
          </div>
          {categoryOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Kategori Produk
              </label>
              <Select
                name="categoryId"
                placeholder="Pilih kategori"
                options={categoryOptions.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                defaultValue=""
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Supplier"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditSupplierData(null);
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setEditOpen(false);
            setEditSupplierData(null);
          }}
        />
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>

        {editSupplierData && (
          <form onSubmit={handleEditSupplier} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Perusahaan
              </label>
              <Input
                name="name"
                placeholder="Masukkan nama perusahaan"
                defaultValue={editSupplierData.name}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Contact Person
                </label>
                <Input
                  name="contactPerson"
                  placeholder="Nama kontak"
                  defaultValue={editSupplierData.contactPerson}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Telepon
                </label>
                <Input
                  name="phone"
                  placeholder="08xxxxxxxxxx"
                  defaultValue={editSupplierData.phone}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="email@perusahaan.com"
                defaultValue={editSupplierData.email || ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Alamat
              </label>
              <Input
                name="address"
                placeholder="Masukkan alamat lengkap"
                defaultValue={editSupplierData.address || ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select
                name="status"
                options={[
                  { label: "Aktif", value: "aktif" },
                  { label: "Nonaktif", value: "nonaktif" },
                ]}
                defaultValue={editSupplierData.status}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditOpen(false);
                  setEditSupplierData(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
