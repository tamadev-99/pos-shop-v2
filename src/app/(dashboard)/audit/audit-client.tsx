"use client";

import { Tabs } from "@/components/ui/tabs";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AuditLogTab } from "./audit-log-tab";
import { StokOpnameTab } from "./stok-opname-tab";

interface Props {
  auditLogs: any[];
  opnames: any[];
  variants: any[];
}

export default function AuditClient({ auditLogs, opnames, variants }: Props) {
  const { user } = useAuth();
  const role = user?.role || "cashier";
  const isReviewer = role === "manager" || role === "owner";

  const auditTabs = isReviewer
    ? [
        { label: "Stok Opname", value: "stok-opname" },
        { label: "Audit Log", value: "audit-log" },
      ]
    : [
        { label: "Stok Opname", value: "stok-opname" },
      ];

  const [activeTab, setActiveTab] = useState("stok-opname");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            {activeTab === "audit-log" ? (
              <ShieldCheck size={20} className="text-violet-400" />
            ) : (
              <ClipboardCheck size={20} className="text-violet-400" />
            )}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
              Audit
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isReviewer
                ? "Pantau aktivitas sistem dan kelola stok opname"
                : "Buat dan isi data stok opname"}
            </p>
          </div>
        </div>
      </div>

      {auditTabs.length > 1 && (
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <Tabs tabs={auditTabs} value={activeTab} onChange={setActiveTab} />
        </div>
      )}

      <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
        {activeTab === "audit-log" && isReviewer && (
          <AuditLogTab auditLogs={auditLogs} />
        )}
        {activeTab === "stok-opname" && (
          <StokOpnameTab opnames={opnames} variants={variants} userRole={role} />
        )}
      </div>
    </div>
  );
}
