import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getAllVariantsFlat } from "@/lib/actions/products";
import PembelianClient from "./pembelian-client";

export default async function PembelianPage() {
  const [purchaseOrders, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getAllVariantsFlat(),
  ]);

  return <PembelianClient initialPOs={purchaseOrders} suppliers={suppliers} products={products} />;
}
