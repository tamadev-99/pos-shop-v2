import { getOrders } from "@/lib/actions/orders";
import PesananClient from "./pesanan-client";

export default async function PesananPage() {
  const orders = await getOrders();

  return <PesananClient initialOrders={orders as any} />;
}
