"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { PelangganTab } from "./pelanggan-tab";

interface KontakClientProps {
    initialCustomers: any[];
    memberTiers?: any[];
}

export default function KontakClient({
    initialCustomers,
    memberTiers,
}: KontakClientProps) {
    const { user } = useAuth();
    const [mainTab, setMainTab] = useState("pelanggan");

    const isCashier = user?.role === "cashier";

    const mainTabOptions = [
        { label: "Pelanggan", value: "pelanggan" },
    ];

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
            <div className="animate-fade-up">
                <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
                    Management Member
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                    Kelola data pelanggan
                </p>
            </div>

            <div className="animate-fade-up">
                <Tabs
                    tabs={mainTabOptions}
                    value={mainTab}
                    onChange={setMainTab}
                    className="w-fit"
                />
            </div>

            {mainTab === "pelanggan" && (
                <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
                    <PelangganTab initialCustomers={initialCustomers} memberTiers={memberTiers} />
                </div>
            )}
        </div>
    );
}
