"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
    Briefcase,
    User,
    ShieldAlert,
    Search,
    CheckCircle2,
    Ban,
    KeyRound,
    ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { updateEmployeeRole, createEmployeeFromOwner, toggleEmployeeBan, resetEmployeePassword } from "@/lib/actions/employees";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

// Standardizing user schema for employee usage
interface EmployeeData {
    id: string;
    name: string;
    email: string;
    role: "owner" | "manager" | "cashier" | string | null;
    banned?: boolean;
    bannedReason?: string | null;
    createdAt: Date;
}

export interface KaryawanTabProps {
    initialEmployees: EmployeeData[];
}

const roleOptions = [
    { label: "Owner", value: "owner" },
    { label: "Manager", value: "manager" },
    { label: "Kasir", value: "cashier" },
];

export function KaryawanTab({ initialEmployees }: KaryawanTabProps) {
    const { user } = useAuth();
    const isOwner = user?.role === "owner";
    const [employees, setEmployees] = useState(initialEmployees);

    // Sync when server re-fetches data after router.refresh()
    useEffect(() => {
        setEmployees(initialEmployees);
    }, [initialEmployees]);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isPending, startTransition] = useTransition();

    // Add employee form state
    const [addOpen, setAddOpen] = useState(false);
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formRole, setFormRole] = useState("cashier");
    const [isAdding, setIsAdding] = useState(false);

    // Ban/Reset password state
    const [resetOpen, setResetOpen] = useState(false);
    const [resetTargetId, setResetTargetId] = useState("");
    const [resetTargetName, setResetTargetName] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleUpdateRole = (id: string, newRole: string) => {
        // Validate role is one of expected
        if (!["owner", "manager", "cashier"].includes(newRole)) return;

        // Optimistic update
        setEmployees(prev =>
            prev.map(emp => emp.id === id ? { ...emp, role: newRole as any } : emp)
        );

        startTransition(async () => {
            try {
                await updateEmployeeRole(id, newRole as "owner" | "manager" | "cashier");
                toast.success("Role karyawan berhasil diperbarui");
            } catch (e) {
                toast.error("Gagal memperbarui role karyawan");
                // Revert on fail
                setEmployees(initialEmployees);
            }
        });
    };

    const handleToggleBan = async (emp: EmployeeData) => {
        const newBanned = !emp.banned;
        // Optimistic update
        setEmployees(prev =>
            prev.map(e => e.id === emp.id ? { ...e, banned: newBanned, bannedReason: newBanned ? "Dinonaktifkan oleh Owner" : null } : e)
        );
        startTransition(async () => {
            try {
                await toggleEmployeeBan(emp.id, newBanned);
                toast.success(newBanned ? `${emp.name} dinonaktifkan` : `${emp.name} diaktifkan kembali`);
            } catch {
                toast.error("Gagal mengubah status karyawan");
                setEmployees(initialEmployees);
            }
        });
    };

    const openResetDialog = (emp: EmployeeData) => {
        setResetTargetId(emp.id);
        setResetTargetName(emp.name);
        setResetPassword("");
        setResetOpen(true);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResetting(true);
        try {
            const result = await resetEmployeePassword(resetTargetId, resetPassword);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Password ${resetTargetName} berhasil direset`);
                setResetOpen(false);
            }
        } catch {
            toast.error("Gagal mereset password");
        } finally {
            setIsResetting(false);
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.email.toLowerCase().includes(search.toLowerCase());
            const matchRole = roleFilter === "all" || emp.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [employees, search, roleFilter]);

    async function handleAddEmployee(e: React.FormEvent) {
        e.preventDefault();
        setIsAdding(true);
        try {
            const formData = new FormData();
            formData.append("name", formName);
            formData.append("email", formEmail);
            formData.append("password", formPassword);
            formData.append("role", formRole);

            const result = await createEmployeeFromOwner(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Karyawan baru berhasil ditambahkan!");
                setAddOpen(false);
                setFormName("");
                setFormEmail("");
                setFormPassword("");
                setFormRole("cashier");
                if (result.user) {
                    setEmployees((prev) => [result.user, ...prev]);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal menambah karyawan");
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center animate-fade-up">
                <h2 className="text-sm font-semibold text-foreground">Data Karyawan</h2>
                {isOwner && (
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                        <Plus size={15} className="mr-1" />
                        Tambah Karyawan
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-4 flex items-center gap-3 animate-fade-up" hover style={{ animationDelay: "60ms" }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(99,102,241,0.25)]">
                        <Briefcase size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                            Total Karyawan
                        </p>
                        <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                            {employees.length}
                        </p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-3 animate-fade-up" hover style={{ animationDelay: "120ms" }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
                        <CheckCircle2 size={18} className="text-accent" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                            Kasir (Aktif)
                        </p>
                        <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                            {employees.filter(e => e.role === "cashier").length}
                        </p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-3 animate-fade-up" hover style={{ animationDelay: "180ms" }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
                        <ShieldAlert size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">
                            Manager / Owner
                        </p>
                        <p className="text-xl md:text-2xl font-bold font-num text-foreground">
                            {employees.filter(e => e.role === "manager" || e.role === "owner").length}
                        </p>
                    </div>
                </Card>
            </div>

            <Card className="animate-fade-up" style={{ animationDelay: "240ms" }}>
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama atau email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-surface border-border"
                        />
                    </div>
                    <div className="w-full sm:w-[200px]">
                        <Select
                            options={[
                                { label: "Semua Role", value: "all" },
                                ...roleOptions
                            ]}
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-surface">
                                <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Karyawan</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">Bergabung</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-[180px]">Role Sistem</th>
                                {isOwner && <th className="px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider w-[160px]">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                                        Tidak ada data karyawan ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="border-b border-border hover:bg-white/[0.025] transition-all">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${emp.banned ? 'bg-destructive/10' : 'bg-surface'}`}>
                                                    <User size={14} className={emp.banned ? 'text-destructive/60' : 'text-muted-foreground'} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${emp.banned ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{emp.name}</span>
                                                    {emp.banned && <Badge variant="destructive" className="mt-0.5 w-fit text-[9px] px-1.5 py-0">Nonaktif</Badge>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{emp.email}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground font-num">
                                            {new Date(emp.createdAt).toLocaleDateString("id-ID", {
                                                year: "numeric", month: "long", day: "numeric"
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Select
                                                options={roleOptions}
                                                value={emp.role || "cashier"}
                                                onValueChange={(val) => handleUpdateRole(emp.id, val)}
                                                disabled={isPending || emp.banned}
                                            />
                                        </td>
                                        {isOwner && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {emp.id !== user?.id && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title={emp.banned ? "Aktifkan Kembali" : "Nonaktifkan"}
                                                                onClick={() => handleToggleBan(emp)}
                                                                disabled={isPending}
                                                            >
                                                                {emp.banned ? <ShieldCheck size={14} className="text-accent" /> : <Ban size={14} className="text-destructive/60" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Reset Password"
                                                                onClick={() => openResetDialog(emp)}
                                                                disabled={isPending}
                                                            >
                                                                <KeyRound size={14} className="text-amber-400" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={isOwner ? 5 : 4} className="py-10 text-center text-sm text-muted-foreground">
                                        Tidak ada data karyawan ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Employee Dialog */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
                <DialogClose onClose={() => setAddOpen(false)} />
                <DialogHeader>
                    <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAddEmployee} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Nama Lengkap</label>
                        <Input
                            required
                            placeholder="Masukkan nama"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Email</label>
                        <Input
                            required
                            type="email"
                            placeholder="karyawan@example.com"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Password</label>
                        <Input
                            required
                            type="password"
                            placeholder="Minimal 8 karakter"
                            minLength={8}
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Role Sistem</label>
                        <Select
                            value={formRole}
                            onValueChange={setFormRole}
                            options={[
                                { label: "Kasir (Staff)", value: "cashier" },
                                { label: "Manager", value: "manager" },
                                { label: "Owner", value: "owner" }
                            ]}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isAdding}>
                            {isAdding ? "Menyimpan..." : "Tambah Karyawan"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
                <DialogClose onClose={() => setResetOpen(false)} />
                <DialogHeader>
                    <DialogTitle>Reset Password: {resetTargetName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
                    <p className="text-xs text-muted-foreground">
                        Masukkan password baru untuk karyawan ini. Mereka akan otomatis logout dari semua perangkat.
                    </p>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold">Password Baru</label>
                        <Input
                            required
                            type="password"
                            placeholder="Minimal 8 karakter"
                            minLength={8}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setResetOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isResetting}>
                            {isResetting ? "Mereset..." : "Reset Password"}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
