"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Users,
  UserPlus,
  Star,
  Wallet,
  User,
  Pencil,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  birthDate: string | null;
  totalSpent: number;
  points: number;
  tier: Tier;
  joinDate: string;
  lastPurchase: string | null;
  createdAt: Date;
}

interface PelangganClientProps {
  initialCustomers: Customer[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const tierBadgeVariant: Record<Tier, BadgeVariant> = {
  Bronze: "outline",
  Silver: "default",
  Gold: "warning",
  Platinum: "success",
};

const tierThresholds: { tier: Tier; min: number; max: number }[] = [
  { tier: "Bronze", min: 0, max: 499 },
  { tier: "Silver", min: 500, max: 999 },
  { tier: "Gold", min: 1000, max: 1999 },
  { tier: "Platinum", min: 2000, max: 2000 },
];

function getNextTier(tier: Tier): { name: string; target: number } | null {
  switch (tier) {
    case "Bronze":
      return { name: "Silver", target: 500 };
    case "Silver":
      return { name: "Gold", target: 1000 };
    case "Gold":
      return { name: "Platinum", target: 2000 };
    case "Platinum":
      return null;
  }
}

function getTierProgress(tier: Tier, points: number): number {
  const next = getNextTier(tier);
  if (!next) return 100;
  const current = tierThresholds.find((t) => t.tier === tier)!;
  const range = next.target - current.min;
  const progress = points - current.min;
  return Math.min(Math.round((progress / range) * 100), 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PelangganClient({
  initialCustomers,
}: PelangganClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customers = initialCustomers;

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // Computed stats
  const totalCustomers = customers.length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = customers.filter((c) =>
    c.joinDate.startsWith(thisMonth)
  ).length;
  const totalActivePoints = customers.reduce((s, c) => s + c.points, 0);
  const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const birthDate = formData.get("birthDate") as string;

    if (!name || !phone) {
      toast.error("Nama dan nomor telepon wajib diisi");
      setSubmitting(false);
      return;
    }

    try {
      await createCustomer({
        name,
        phone,
        email: email || undefined,
        address: address || undefined,
        birthDate: birthDate || undefined,
      });
      toast.success("Pelanggan berhasil ditambahkan");
      setAddOpen(false);
      form.reset();
      router.refresh();
    } catch {
      toast.error("Gagal menambahkan pelanggan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editCustomer) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const birthDate = formData.get("birthDate") as string;

    if (!name || !phone) {
      toast.error("Nama dan nomor telepon wajib diisi");
      setSubmitting(false);
      return;
    }

    try {
      await updateCustomer(editCustomer.id, {
        name,
        phone,
        email: email || undefined,
        address: address || undefined,
        birthDate: birthDate || undefined,
      });
      toast.success("Pelanggan berhasil diperbarui");
      setEditOpen(false);
      setEditCustomer(null);
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui pelanggan");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(customer: Customer) {
    setEditCustomer(customer);
    setEditOpen(true);
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Pelanggan
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola data pelanggan dan program loyalitas
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            <Users size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Pelanggan
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(totalCustomers)}
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
            <UserPlus size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Pelanggan Baru
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(newThisMonth)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="warning"
          style={{ animationDelay: "120ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <Star size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Poin Aktif
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatNumber(totalActivePoints)}
            </p>
          </div>
        </Card>

        <Card
          className="p-3 md:p-4 flex items-center gap-3 animate-fade-up"
          hover
          glow="accent"
          style={{ animationDelay: "180ms" }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(59,130,246,0.25)]">
            <Wallet size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
              Total Belanja
            </p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {formatRupiah(totalSpentAll)}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
        <Input
          placeholder="Cari nama atau nomor telepon..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[300px]"
        />
      </div>

      {/* Table */}
      <Card
        className="overflow-hidden animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Telepon
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Email
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Total Belanja
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Poin
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Terakhir Belanja
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <User size={14} className="text-muted-dim" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden sm:table-cell">
                    {customer.phone}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {customer.email || "-"}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num hidden md:table-cell">
                    {formatRupiah(customer.totalSpent)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-num text-foreground hidden sm:table-cell">
                    {formatNumber(customer.points)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge variant={tierBadgeVariant[customer.tier]}>
                      {customer.tier}
                    </Badge>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                    {customer.lastPurchase || "-"}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailCustomer(customer)}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(customer)}
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
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <Users size={28} className="mx-auto mb-2 opacity-10" />
                    Tidak ada pelanggan ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog
        open={detailCustomer !== null}
        onClose={() => setDetailCustomer(null)}
        className="max-w-lg"
      >
        <DialogClose onClose={() => setDetailCustomer(null)} />
        <DialogHeader>
          <DialogTitle>Detail Pelanggan</DialogTitle>
        </DialogHeader>

        {detailCustomer && (
          <div className="space-y-5">
            {/* Customer Info */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center shrink-0">
                <User size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  {detailCustomer.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detailCustomer.phone} &middot;{" "}
                  {detailCustomer.email || "-"}
                </p>
                <p className="text-[11px] text-muted-dim mt-0.5">
                  {detailCustomer.address || "-"}
                </p>
              </div>
              <Badge variant={tierBadgeVariant[detailCustomer.tier]}>
                {detailCustomer.tier}
              </Badge>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Total Belanja
                </p>
                <p className="text-sm font-bold font-num text-foreground mt-1">
                  {formatRupiah(detailCustomer.totalSpent)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Poin
                </p>
                <p className="text-sm font-bold font-num text-foreground mt-1">
                  {formatNumber(detailCustomer.points)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Bergabung
                </p>
                <p className="text-sm font-bold font-num text-foreground mt-1">
                  {detailCustomer.joinDate}
                </p>
              </div>
            </div>

            {/* Loyalty Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Progress Tier
                </p>
                <p className="text-[11px] text-muted-dim font-num">
                  {getNextTier(detailCustomer.tier)
                    ? `${detailCustomer.points} / ${getNextTier(detailCustomer.tier)!.target} poin ke ${getNextTier(detailCustomer.tier)!.name}`
                    : "Tier tertinggi tercapai"}
                </p>
              </div>
              <div className="w-full rounded-full h-2 bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                  style={{
                    width: `${getTierProgress(detailCustomer.tier, detailCustomer.points)}%`,
                  }}
                />
              </div>
            </div>

            {/* Additional Info */}
            {detailCustomer.birthDate && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[10px] text-muted-dim uppercase tracking-wider">
                  Tanggal Lahir
                </p>
                <p className="text-xs font-num text-foreground mt-1">
                  {detailCustomer.birthDate}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        className="max-w-md"
      >
        <DialogClose onClose={() => setAddOpen(false)} />
        <DialogHeader>
          <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Lengkap
            </label>
            <Input name="name" placeholder="Masukkan nama pelanggan" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nomor Telepon
              </label>
              <Input name="phone" placeholder="08xxxxxxxxxx" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input name="email" type="email" placeholder="email@contoh.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Alamat
            </label>
            <Input name="address" placeholder="Masukkan alamat lengkap" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tanggal Lahir
            </label>
            <Input name="birthDate" type="date" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditCustomer(null);
        }}
        className="max-w-md"
      >
        <DialogClose
          onClose={() => {
            setEditOpen(false);
            setEditCustomer(null);
          }}
        />
        <DialogHeader>
          <DialogTitle>Edit Pelanggan</DialogTitle>
        </DialogHeader>

        {editCustomer && (
          <form onSubmit={handleEditCustomer} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nama Lengkap
              </label>
              <Input
                name="name"
                placeholder="Masukkan nama pelanggan"
                defaultValue={editCustomer.name}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nomor Telepon
                </label>
                <Input
                  name="phone"
                  placeholder="08xxxxxxxxxx"
                  defaultValue={editCustomer.phone}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="email@contoh.com"
                  defaultValue={editCustomer.email || ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Alamat
              </label>
              <Input
                name="address"
                placeholder="Masukkan alamat lengkap"
                defaultValue={editCustomer.address || ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tanggal Lahir
              </label>
              <Input
                name="birthDate"
                type="date"
                defaultValue={editCustomer.birthDate || ""}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditOpen(false);
                  setEditCustomer(null);
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
