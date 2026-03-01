import { getCustomers } from "@/lib/actions/customers";
import PelangganClient from "./pelanggan-client";

export default async function PelangganPage() {
  const customers = await getCustomers();
  return <PelangganClient initialCustomers={customers} />;
}
