import { getPurchaseOrders } from "@/lib/actions/purchases";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getAllVariantsFlat, getCategories } from "@/lib/actions/products";
import PembelianClient from "./pembelian-client";

export default async function PembelianPage() {
  const [purchaseOrders, suppliers, products, categories] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getAllVariantsFlat(),
    getCategories(),
  ]);

  return (
    <PembelianClient
      initialPOs={purchaseOrders}
      suppliers={suppliers}
      products={products}
      categories={categories}
    />
  );
}
