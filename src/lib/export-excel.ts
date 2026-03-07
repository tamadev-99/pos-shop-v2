"use client";

/**
 * Export data to Excel-compatible format (.xlsx via CSV with BOM).
 * Excel can open CSV files correctly when saved with .xlsx extension + UTF-8 BOM.
 */
export function exportToExcel(
    data: Record<string, unknown>[],
    filename: string,
    columns?: { key: string; label: string }[]
) {
    if (data.length === 0) return;

    const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));
    const header = cols.map((c) => `"${c.label}"`).join("\t");

    const rows = data.map((row) =>
        cols
            .map((c) => {
                const val = row[c.key];
                if (val == null) return '""';
                if (typeof val === "number") return String(val);
                return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join("\t")
    );

    const tsv = [header, ...rows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Format number as Rupiah string for Excel export
 */
export function formatRupiahExcel(value: number): string {
    return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Export page as PDF using browser print dialog with print-friendly styles.
 */
export function exportToPDF(title: string) {
    window.print();
}
