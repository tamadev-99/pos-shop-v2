import { getAllTransactions } from "@/lib/actions/admin-subscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Calendar, ShoppingCart, User, ExternalLink } from "lucide-react";

export default async function AdminTransactionsPage() {
  const transactions = await getAllTransactions();

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Log Transaksi</h1>
        <p className="text-muted-foreground font-medium">History pembayaran langganan dari seluruh tenant Noru POS.</p>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/10">
              <CreditCard className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Semua Transaksi</CardTitle>
              <CardDescription className="text-sm">Data transaksi yang tercatat di database lokal.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-bold text-foreground">Invoice ID</TableHead>
                <TableHead className="font-bold text-foreground">Tenant / Owner</TableHead>
                <TableHead className="font-bold text-foreground">Paket</TableHead>
                <TableHead className="font-bold text-foreground">Nominal</TableHead>
                <TableHead className="font-bold text-foreground">Metode</TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="font-bold text-foreground">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                    Belum ada riwayat transaksi.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border/40 hover:bg-surface/50 transition-colors">
                    <TableCell className="font-semibold text-violet-600">
                      <div className="flex items-center gap-2">
                        <span>{tx.mayarInvoiceId || "INV-"+tx.id.substring(0, 8)}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{tx.tenant.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Owner ID: {tx.tenant.ownerId.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold bg-secondary/30 text-secondary-foreground text-[10px]">
                        {tx.plan?.name || "Premium Plan"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground whitespace-nowrap">
                      Rp {parseInt(tx.amount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      {tx.paymentMethod?.toUpperCase() || "MAYAR"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`gap-1.5 font-bold text-[10px] uppercase tracking-widest ${
                          tx.status === "paid" 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                        variant="outline"
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${tx.status === "paid" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium tabular-nums">
                      {tx.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
