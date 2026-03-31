import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getProducts, getCategories, getAllVariantsFlat } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";
import ProdukClient from "./produk-client";
import { getActiveStoreDetails } from "@/lib/actions/store-context";

export default async function ProdukPage() {
  await enforceRouteAccess('/produk');
  const [productsResult, categories, suppliers, variants, storeDetails] = await Promise.all([
    getProducts({ limit: 10, offset: 0 }),
    getCategories(),
    getSuppliers(),
    getAllVariantsFlat(),
    getActiveStoreDetails(),
  ]);

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    productCount: productsResult.data.filter((p) => p.categoryId === cat.id).length,
  }));

  return (
    <ProdukClient
      initialProducts={productsResult.data}
      totalProducts={productsResult.totalRecords}
      categories={categoriesWithCount}
      suppliers={suppliers}
      initialVariants={variants}
      storeType={storeDetails.type || "clothing"}
    />
  );
}
