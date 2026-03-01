import { getAllVariantsFlat } from "@/lib/actions/products";
import InventarisClient from "./inventaris-client";

export default async function InventarisPage() {
  const variants = await getAllVariantsFlat();
  return <InventarisClient initialVariants={variants} />;
}
