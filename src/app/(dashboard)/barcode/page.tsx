import { getAllVariantsFlat } from "@/lib/actions/products";
import BarcodeClient from "./barcode-client";

export default async function BarcodePage() {
  const variants = await getAllVariantsFlat();
  return <BarcodeClient variants={variants as any} />;
}
