"use client";

import { Tabs } from "@/components/ui/tabs";
import { HakAksesTab } from "./components/hak-akses-tab";
import { useState, useMemo, useTransition } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
    createEmployeeProfile, 
    updateEmployeeProfile, 
    resetEmployeePin, 
    deleteEmployeeProfile 
} from "@/lib/actions/employee-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
    Dialog, 
    DialogClose, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { 
    Plus, 
    Users, 
    ShieldCheck, 
    Briefcase, 
    ShieldAlert, 
    Search, 
    User, 
    KeyRound, 
    Pen, 
    Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeProfileData {
    id: string;
    name: string;
    role: string;
    pinHash: string;
    isActive: boolean;
    createdAt: Date;
}

export default function KaryawanClient({ 
    initialEmployees,
    initialPermissions 
}: { 
    initialEmployees: EmployeeProfileData[],
    initialPermissions?: Record<string, string[]>
}) {
    const { activeEmployeeRole, user } = useAuth();
    const router = useRouter();
    // Use activeEmployeeRole if set, fallback to user.role
    const role = activeEmployeeRole || user?.role;
    const isOwner = role === "owner";

    const [activeTab, setActiveTab] = useState("list");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isPending, startTransition] = useTransition();

    // Dialog flags
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [resetPinOpen, setResetPinOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState<{ id?: string, name: string; role: string; pin: string }>({
        name: "",
        role: "cashier",
        pin: ""
    });
    
    // Add Employee
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createEmployeeProfile({
                name: formData.name,
                role: formData.role,
                pin: formData.pin,
            });
            if (res.success) {
                toast.success("Karyawan baru berhasil ditambahkan!");
                setAddOpen(false);
                setFormData({ name: "", role: "cashier", pin: "" });
            } else {
                toast.error(res.error || "Gagal menambahkan karyawan");
            }
        });
    };

    // Edit Employee
    const openEdit = (emp: EmployeeProfileData) => {
        setFormData({ id: emp.id, name: emp.name, role: emp.role, pin: "" });
        setEditOpen(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) return;
        
        startTransition(async () => {
            const res = await updateEmployeeProfile(formData.id!, {
                name: formData.name,
                role: formData.role,
            });
            if (res.success) {
                toast.success("Profil karyawan berhasil diperbarui");
                setEditOpen(false);
            } else {
                toast.error(res.error || "Gagal memperbarui profil");
            }
        });
    };

    // Reset PIN
    const openResetPin = (emp: EmployeeProfileData) => {
        setFormData({ id: emp.id, name: emp.name, role: "", pin: "" });
        setResetPinOpen(true);
    };

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) return;

        startTransition(async () => {
            const res = await resetEmployeePin(formData.id!, formData.pin);
            if (res.success) {
                toast.success("PIN karyawan berhasil direset");
                setResetPinOpen(false);
            } else {
                toast.error(res.error || "Gagal mereset PIN");
            }
        });
    };

    // Delete Employee
    const openDelete = (emp: EmployeeProfileData) => {
        setFormData({ id: emp.id, name: emp.name, role: "", pin: "" });
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!formData.id) return;
        
        startTransition(async () => {
            const res = await deleteEmployeeProfile(formData.id!);
            if (res.success) {
                toast.success("Profil karyawan berhasil dihapus");
                setDeleteOpen(false);
            } else {
                toast.error(res.error || "Gagal menghapus karyawan");
            }
        });
    };

    // Toggling Status
    const handleToggleStatus = async (emp: EmployeeProfileData) => {
        startTransition(async () => {
            const res = await updateEmployeeProfile(emp.id, { isActive: !emp.isActive });
            if (res.success) {
                toast.success(emp.isActive ? "Karyawan dinonaktifkan" : "Karyawan diaktifkan");
            } else {
                toast.error(res.error || "Gagal mengubah status");
            }
        });
    };

    const filteredEmployees = useMemo(() => {
        return initialEmployees.filter((emp) => {
            const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase());
            const matchRole = roleFilter === "all" || emp.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [initialEmployees, search, roleFilter]);

    if (!isOwner) {
        return (
            <div className="p-4 md:p-6 text-center text-muted-foreground">
                Hanya Owner yang dapat mengakses halaman ini.
            </div>
        );
    }

    const employeeTabs = [
        { label: "Daftar Karyawan", value: "list" },
        { label: "Hak Akses Modul", value: "permissions" },
    ];

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
                        Manajemen Karyawan
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Kelola akses, profil, dan hak akses modul untuk staf Anda
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="hidden md:flex" onClick={() => {
                        setFormData({ name: "", role: "cashier", pin: "" });
                        setAddOpen(true);
                    }}>
                        <Plus size={15} className="mr-1.5" />
                        Tambah Karyawan
                    </Button>
                    <Button size="icon" className="md:hidden" onClick={() => {
                        setFormData({ name: "", role: "cashier", pin: "" });
                        setAddOpen(true);
                    }}>
                        <Plus size={18} />
                    </Button>
                </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
                <Tabs tabs={employeeTabs} value={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === "list" && (
                <div className="space-y-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <Card className="p-4 flex items-center gap-3 border-none bg-surface/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(99,102,241,0.25)]">
                                <Users size={18} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                                    Total Karyawan
                                </p>
                                <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                                    {initialEmployees.length}
                                </p>
                            </div>
                        </Card>

                        <Card className="p-4 flex items-center gap-3 border-none bg-surface/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
                                <Briefcase size={18} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                                    Staf / Kasir Aktif
                                </p>
                                <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                                    {initialEmployees.filter(e => e.role === "cashier" && e.isActive).length}
                                </p>
                            </div>
                        </Card>

                        <Card className="p-4 flex items-center gap-3 border-none bg-surface/50 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
                                <ShieldAlert size={18} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                                    Admin / Manager 
                                </p>
                                <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                                    {initialEmployees.filter(e => (e.role === "manager" || e.role === "admin") && e.isActive).length}
                                </p>
                            </div>
                        </Card>
                    </div>

                    <Card className="overflow-hidden border-border bg-card shadow-sm">
                        <div className="p-4 border-b border-border bg-surface/30 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama karyawan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-surface/50 border-border focus-visible:ring-indigo-500/20"
                                />
                            </div>
                            <div className="w-full sm:w-[200px]">
                                <Select
                                    options={[
                                        { label: "Semua Role", value: "all" },
                                        { label: "Owner", value: "owner" },
                                        { label: "Admin", value: "admin" },
                                        { label: "Manager", value: "manager" },
                                        { label: "Kasir", value: "cashier" },
                                    ]}
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-surface/50">
                                        <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Karyawan</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Bergabung</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Users size={32} className="text-muted-dim opacity-20" />
                                                    <p className="text-sm text-muted-foreground">Tidak ada karyawan yang ditemukan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="border-b border-border hover:bg-white/[0.015] transition-all group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${!emp.isActive ? 'bg-destructive/10' : 'bg-surface border border-border group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-colors'}`}>
                                                            <User size={15} className={!emp.isActive ? 'text-destructive/60' : 'text-muted-foreground group-hover:text-indigo-400 transition-colors'} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-semibold tracking-tight ${!emp.isActive ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{emp.name}</span>
                                                            {!emp.isActive && <Badge variant="destructive" className="mt-0.5 w-fit text-[9px] px-1.5 py-0 uppercase tracking-tighter">Nonaktif</Badge>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground font-num">
                                                    {new Date(emp.createdAt).toLocaleDateString("id-ID", {
                                                        year: "numeric", month: "long", day: "numeric"
                                                    })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={emp.role === "owner" ? "default" : "outline"} className={cn("text-[9px] uppercase font-bold tracking-wider px-2", 
                                                        emp.role === "owner" ? "bg-indigo-500 text-white border-transparent" : "text-muted-foreground border-border")}>
                                                        {emp.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {emp.role !== "owner" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title={emp.isActive ? "Nonaktifkan Akses" : "Aktifkan Akses"}
                                                                disabled={isPending}
                                                                onClick={() => handleToggleStatus(emp)}
                                                                className="hover:bg-indigo-500/10 hover:text-indigo-400"
                                                            >
                                                                <ShieldCheck size={14} className={emp.isActive ? "text-muted-foreground" : "text-emerald-400"} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Reset PIN"
                                                            onClick={() => openResetPin(emp)}
                                                            disabled={isPending}
                                                            className="hover:bg-amber-500/10 hover:text-amber-400"
                                                        >
                                                            <KeyRound size={14} className="text-amber-500/70" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Edit"
                                                            onClick={() => openEdit(emp)}
                                                            disabled={isPending}
                                                            className="hover:bg-indigo-500/10 hover:text-indigo-400"
                                                        >
                                                            <Pen size={14} className="text-indigo-400/70" />
                                                        </Button>
                                                        {emp.role !== "owner" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Hapus"
                                                                onClick={() => openDelete(emp)}
                                                                disabled={isPending}
                                                                className="hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <Trash2 size={14} className="text-destructive/60" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "permissions" && (
                <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
                    <HakAksesTab initialPermissions={initialPermissions} />
                </div>
            )}

            {/* Dialog Tambah */}
            <Dialog open={addOpen} onClose={() => !isPending && setAddOpen(false)}>
                <DialogClose onClose={() => !isPending && setAddOpen(false)} />
                <DialogHeader>
                    <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Nama Lengkap</label>
                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Cth: Budi Santoso" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Role Akses</label>
                        <Select 
                            value={formData.role} 
                            onValueChange={r => setFormData({ ...formData, role: r })}
                            options={[
                                { label: "Kasir", value: "cashier" },
                                { label: "Manager", value: "manager" },
                                { label: "Admin", value: "admin" }
                            ]}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Buat PIN Login (6 Digit)</label>
                        <Input 
                            required 
                            type="password"
                            maxLength={6} 
                            value={formData.pin} 
                            onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })} 
                            placeholder="Cth: 123456" 
                            className="font-num tracking-[0.5em] text-center text-lg bg-surface/50 border-indigo-500/20 focus-visible:ring-indigo-500/20"
                        />
                        <p className="text-[10px] text-muted-foreground text-center bg-indigo-500/5 py-1 px-2 rounded-md">PIN digunakan karyawan untuk login ke perangkat POS ini.</p>
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setAddOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isPending || formData.pin.length !== 6}>{isPending ? "Menyimpan..." : "Simpan Profil"}</Button>
                    </div>
                </form>
            </Dialog>

            {/* Dialog Edit */}
            <Dialog open={editOpen} onClose={() => !isPending && setEditOpen(false)}>
                <DialogClose onClose={() => !isPending && setEditOpen(false)} />
                <DialogHeader>
                    <DialogTitle>Edit Karyawan: {formData.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEdit} className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Nama Lengkap</label>
                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Role</label>
                        <Select 
                            value={formData.role} 
                            onValueChange={r => setFormData({ ...formData, role: r })}
                            disabled={formData.role === "owner"}
                            options={[
                                { label: "Owner", value: "owner" },
                                { label: "Kasir", value: "cashier" },
                                { label: "Manager", value: "manager" },
                                { label: "Admin", value: "admin" }
                            ]}
                        />
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setEditOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan Perubahan"}</Button>
                    </div>
                </form>
            </Dialog>

            {/* Dialog Reset PIN */}
            <Dialog open={resetPinOpen} onClose={() => !isPending && setResetPinOpen(false)}>
                <DialogClose onClose={() => !isPending && setResetPinOpen(false)} />
                <DialogHeader>
                    <DialogTitle>Reset PIN: {formData.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleResetPin} className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-amber-500">PIN Baru (6 Digit)</label>
                        <Input 
                            required 
                            type="password"
                            maxLength={6} 
                            value={formData.pin} 
                            onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })} 
                            placeholder="Cth: 654321" 
                            className="font-num tracking-[0.5em] text-center text-lg border-amber-500/30 bg-amber-500/5 focus-visible:ring-amber-500"
                        />
                    </div>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setResetPinOpen(false)}>Batal</Button>
                        <Button type="submit" variant="default" className="bg-amber-500 hover:bg-amber-600 border-none shadow-amber-500/20 shadow-md" disabled={isPending || formData.pin.length !== 6}>{isPending ? "Mereset..." : "Ganti PIN"}</Button>
                    </div>
                </form>
            </Dialog>

            {/* Dialog Hapus */}
            <Dialog open={deleteOpen} onClose={() => !isPending && setDeleteOpen(false)}>
                <DialogClose onClose={() => !isPending && setDeleteOpen(false)} />
                <DialogHeader>
                    <DialogTitle className="text-destructive">Hapus {formData.name}?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <p className="text-sm text-foreground">
                        Tindakan ini tidak dapat dibatalkan. Profil <strong className="font-semibold">{formData.name}</strong> akan dihapus selamanya, namun riwayat transaksi mereka (log audit, penjualan) akan tetap aman di database dengan status "N/A" atau nama statis mereka.
                    </p>
                    
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" disabled={isPending} onClick={() => setDeleteOpen(false)}>Batal</Button>
                        <Button variant="destructive" disabled={isPending} onClick={handleDelete}>{isPending ? "Menghapus..." : "Ya, Hapus Karyawan"}</Button>
                    </div>
                </div>
            </Dialog>

        </div>
    );
}
