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
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Package,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface KategoriTabProps {
  categories: CategoryWithCount[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KategoriTab({ categories }: KategoriTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setEditCategory(null);
  }

  function openForm(category?: CategoryWithCount) {
    if (category) {
      setEditCategory(category);
      setFormName(category.name);
      setFormDescription(category.description || "");
    } else {
      resetForm();
    }
    setFormOpen(true);
  }

  function openDeleteDialog(category: CategoryWithCount) {
    setDeleteTarget(category);
    setDeleteOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editCategory) {
        await updateCategory(editCategory.id, {
          name: formName,
          description: formDescription,
        });
        toast.success("Kategori berhasil diperbarui");
      } else {
        await createCategory({
          name: formName,
          description: formDescription,
        });
        toast.success("Kategori berhasil ditambahkan");
      }

      setFormOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(
        editCategory
          ? "Gagal memperbarui kategori"
          : "Gagal menambahkan kategori"
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);

    try {
      await deleteCategory(deleteTarget.id);
      toast.success(`Kategori "${deleteTarget.name}" berhasil dihapus`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error("Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-up">
        <h2 className="text-sm font-semibold text-foreground">Data Kategori</h2>
        <Button onClick={() => openForm()} size="sm">
          <Plus size={15} className="mr-1" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search */}
      <div
        className="flex items-center justify-end animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <Input
          placeholder="Cari kategori..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[260px]"
        />
      </div>

      {/* Category Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Deskripsi
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Jumlah Produk
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-border hover:bg-white/[0.025] transition-all duration-300"
                >
                  {/* Nama */}
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <FolderOpen size={14} className="text-muted-dim" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {cat.name}
                      </span>
                    </div>
                  </td>

                  {/* Deskripsi */}
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {cat.description || "-"}
                  </td>

                  {/* Jumlah Produk */}
                  <td className="px-3 md:px-4 py-3">
                    <Badge variant={cat.productCount > 0 ? "default" : "outline"}>
                      <Package size={11} className="mr-1" />
                      {cat.productCount} produk
                    </Badge>
                  </td>

                  {/* Aksi */}
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openForm(cat)}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(cat)}
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
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <FolderOpen
                      size={28}
                      className="mx-auto mb-2 opacity-10"
                    />
                    Tidak ada kategori ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setFormOpen(false);
            resetForm();
          }}
        />
        <DialogHeader>
          <DialogTitle>
            {editCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Kategori
            </label>
            <Input
              placeholder="Masukkan nama kategori"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Deskripsi
            </label>
            <Input
              placeholder="Masukkan deskripsi kategori (opsional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

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
                : editCategory
                  ? "Simpan Perubahan"
                  : "Simpan Kategori"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        className="max-w-sm"
      >
        <DialogClose
          onClose={() => {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }}
        />
        <DialogHeader>
          <DialogTitle>Hapus Kategori</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus kategori{" "}
            <span className="font-semibold text-foreground">
              &quot;{deleteTarget?.name}&quot;
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>

          {deleteTarget && deleteTarget.productCount > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/[0.05] p-3">
              <p className="text-xs text-warning">
                Kategori ini memiliki {deleteTarget.productCount} produk terkait.
                Menghapus kategori mungkin akan gagal jika masih ada produk yang menggunakannya.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Menghapus..." : "Hapus Kategori"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
