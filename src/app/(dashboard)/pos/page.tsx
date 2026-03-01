import { getProducts } from "@/lib/actions/products";
import { getCustomers } from "@/lib/actions/customers";
import POSClient from "./pos-client";

export default async function POSPage() {
  const [products, customers] = await Promise.all([
    getProducts({ status: "aktif" }),
    getCustomers(),
  ]);
  return <POSClient initialProducts={products} customers={customers as any} />;
}
