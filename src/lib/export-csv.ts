"use client";

/**
 * Convert array of objects to CSV string and trigger download
 */
export function exportToCSV(
    data: Record<string, unknown>[],
    filename: string,
    columns?: { key: string; label: string }[]
) {
    if (data.length === 0) return;

    const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));
    const header = cols.map((c) => `"${c.label}"`).join(",");

    const rows = data.map((row) =>
        cols
            .map((c) => {
                const val = row[c.key];
                if (val == null) return '""';
                if (typeof val === "number") return String(val);
                return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(",")
    );

    const csv = [header, ...rows].join("\n");
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Format number as Rupiah string for CSV export
 */
export function formatRupiahCSV(value: number): string {
    return new Intl.NumberFormat("id-ID").format(value);
}
