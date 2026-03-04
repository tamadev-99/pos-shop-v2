"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, KeyRound, Shield, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function AkunTab() {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const roleText = user?.role === "owner" ? "Pemilik Toko" : user?.role === "manager" ? "Manajer" : "Kasir";

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Semua field password harus diisi");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Password baru dan konfirmasi password tidak cocok");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password baru minimal 8 karakter");
            return;
        }

        setLoading(true);

        const { error } = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true
        });

        setLoading(false);

        if (error) {
            toast.error(error.message || "Gagal mengubah password");
        } else {
            toast.success("Password berhasil diubah!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    };

    if (!user) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                    <p>Memuat data pengguna...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(99,102,241,0.25)]">
                            <User size={15} className="text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle>Profil Anda</CardTitle>
                            <CardDescription>
                                Informasi dasar akun yang sedang aktif
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 flex flex-col justify-center rounded-xl bg-surface border border-border p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 blur-2xl -mr-10 -mt-10 rounded-full transition-all group-hover:bg-blue-500/20" />
                            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1 z-10">
                                <User size={13} />
                                Nama Lengkap
                            </label>
                            <p className="text-[15px] font-semibold text-foreground z-10">{user.name}</p>
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-center rounded-xl bg-surface border border-border p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/5 blur-2xl -mr-10 -mt-10 rounded-full transition-all group-hover:bg-violet-500/20" />
                            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1 z-10">
                                <Mail size={13} />
                                Alamat Email
                            </label>
                            <p className="text-[15px] font-medium text-foreground z-10">{user.email}</p>
                        </div>

                        <div className="space-y-1.5 flex flex-col justify-center md:col-span-2 rounded-xl bg-surface border border-border p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-indigo-600/5 blur-2xl -mr-12 -mt-12 rounded-full transition-all group-hover:bg-accent/20" />
                            <div className="flex items-center justify-between z-10">
                                <div>
                                    <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1 z-10">
                                        <Shield size={13} />
                                        Peran Sistem
                                    </label>
                                    <p className="text-[15px] font-medium text-foreground capitalize flex items-center gap-2">
                                        {roleText}
                                    </p>
                                </div>
                                <Badge variant={user.role === 'owner' ? 'default' : user?.role === 'manager' ? 'warning' : 'outline'} className="shadow-none">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]">
                            <KeyRound size={15} className="text-amber-400" />
                        </div>
                        <div>
                            <CardTitle>Keamanan & Kata Sandi</CardTitle>
                            <CardDescription>
                                Ganti password untuk mengamankan akun
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Password Saat Ini
                            </label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Masukkan password Anda saat ini"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border mt-4 pb-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Password Baru
                                </label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Konfirmasi Password Baru
                                </label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ketik ulang password baru"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 mt-2">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Ubah Password"
                            )}
                        </Button>
                        <p className="text-[10px] text-muted-dim max-w-sm mt-3 leading-relaxed">
                            Catatan: Mengubah password akan mengeluarkan sesi aktif Anda dari perangkat lain.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
