import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function TenantsAdminPage() {
  const allTenants = await db.query.tenants.findMany({
    with: {
      owner: true,
      stores: true,
    },
    orderBy: [desc(tenants.createdAt)],
  });

  const getStatusBadge = (status: string, expiry: Date | null) => {
    const now = new Date();
    const isExpired = expiry && expiry < now;

    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </Badge>
        );
      case "trial":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="w-3 h-3" />
            Trial
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Tenant</h1>
        <p className="text-muted-foreground">Kelola semua akun bisnis dan status langganan platform.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenant</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTenants.length}</div>
            <p className="text-xs text-muted-foreground">Bisnis terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Estimasi</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {(allTenants.filter(t => t.subscriptionStatus === "active").length * 100000).toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Bulan ini (Active only)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Masa Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTenants.filter(t => t.subscriptionStatus === "trial").length}
            </div>
            <p className="text-xs text-muted-foreground">Potensial konversi</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Bisnis</CardTitle>
          <CardDescription>Detail langganan dan informasi pemilik.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bisnis</TableHead>
                <TableHead>Pemilik</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Masa Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTenants.map((tenant) => {
                const expiry = tenant.subscriptionEndsAt || tenant.trialEndsAt;
                return (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{tenant.owner.name}</span>
                        <span className="text-xs text-muted-foreground">{tenant.owner.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.stores.length} Toko</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tenant.subscriptionStatus, expiry)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {expiry?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* TODO: Add edit/manage button */}
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">
                        Kelola
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
