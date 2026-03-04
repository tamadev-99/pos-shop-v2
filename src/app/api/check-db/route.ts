import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const settings = await db.select().from(storeSettings);
    return NextResponse.json({ settings });
}
