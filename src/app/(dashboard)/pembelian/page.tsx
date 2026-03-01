import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getSuppliers } from "@/lib/actions/suppliers";
import PembelianClient from "./pembelian-client";

export default async function PembelianPage() {
  const [purchaseOrders, suppliers] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
  ]);

  return <PembelianClient initialPOs={purchaseOrders} suppliers={suppliers} />;
}
