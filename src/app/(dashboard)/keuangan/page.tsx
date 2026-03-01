import { getTransactions, getDailyReconciliation } from "@/lib/actions/finance";
import KeuanganClient from "./keuangan-client";

export default async function KeuanganPage() {
  const [transactions, todayReconciliation] = await Promise.all([
    getTransactions(),
    getDailyReconciliation(new Date().toISOString().split("T")[0]),
  ]);

  // Hitung saldo kas sederhana (ini bisa disempurnakan dengan query khusus jika perlu)
  const totalPemasukan = transactions
    .filter((t) => t.type === "masuk")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t) => t.type === "keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  // Map to the client shape
  const mappedTransactions = transactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    category: t.category,
    type: t.type === "masuk" ? "pemasukan" : "pengeluaran",
    amount: t.amount,
  }));

  return (
    <KeuanganClient
      initialTransactions={mappedTransactions}
      saldoKas={saldoKas}
      todayReconciliation={todayReconciliation}
    />
  );
}
