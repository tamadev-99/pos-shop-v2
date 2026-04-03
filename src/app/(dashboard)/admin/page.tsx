import { getPlatformStats } from "@/lib/actions/admin-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground font-medium">Monitoring performa Noru POS secara real-time dari database.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-indigo-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-violet-700 uppercase tracking-wider">Total Revenue</CardTitle>
            <CreditCard className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">Rp {stats.totalRevenue.toLocaleString("id-ID")}</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>Lifetime earnings</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Total Tenants</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.totalTenants}</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-blue-600">
              <Activity className="h-3 w-3" />
              <span>Bisnis terdaftar</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Active Pro</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.activeCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <span>Subscription active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Trial Users</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.trialCount}</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600">
              <span>Potential conversions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="shadow-sm border-border/40">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Transaksi Terbaru</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">10 aktivitas pembayaran terakhir dari tenant.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-foreground">Bisnis</TableHead>
                  <TableHead className="font-bold text-foreground">Paket</TableHead>
                  <TableHead className="font-bold text-foreground">Nominal</TableHead>
                  <TableHead className="font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                      Belum ada transaksi yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-border/40 hover:bg-surface/50 transition-colors">
                      <TableCell className="font-medium">{tx.tenant.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium bg-secondary/30">
                          {tx.plan.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        Rp {parseInt(tx.amount).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`gap-1 ${
                            tx.status === "paid" 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                          variant="outline"
                        >
                          {tx.status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tx.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
