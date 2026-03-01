import { getSuppliers } from "@/lib/actions/suppliers";
import { getCategories } from "@/lib/actions/products";
import SupplierClient from "./supplier-client";

export default async function SupplierPage() {
  const [suppliers, categories] = await Promise.all([
    getSuppliers(),
    getCategories(),
  ]);

  return <SupplierClient initialSuppliers={suppliers} categories={categories} />;
}
