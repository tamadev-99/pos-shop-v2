import { getProducts, getCategories, getAllVariantsFlat } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";
import ProdukClient from "./produk-client";

export default async function ProdukPage() {
  const [productsResult, categories, suppliers, variants] = await Promise.all([
    getProducts({ limit: 10, offset: 0 }),
    getCategories(),
    getSuppliers(),
    getAllVariantsFlat(),
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
    />
  );
}
