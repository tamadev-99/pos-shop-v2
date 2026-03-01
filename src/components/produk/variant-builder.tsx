"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Layers } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantRow {
  color: string;
  size: string;
  sku: string;
  stock: number;
  buyPrice: number;
  sellPrice: number;
}

export interface VariantBuilderProps {
  colors: string[];
  sizes: string[];
  onColorsChange: (colors: string[]) => void;
  onSizesChange: (sizes: string[]) => void;
  onVariantsChange: (variants: VariantRow[]) => void;
  skuPrefix?: string;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "Hitam",
  "Putih",
  "Merah",
  "Navy",
  "Cream",
  "Maroon",
  "Army Green",
  "Dusty Pink",
  "Coklat",
  "Khaki",
  "Abu-Abu",
  "Gold",
  "Silver",
  "Rose Gold",
  "Sage",
  "Mocca",
  "Hijau",
];

const SIZE_GROUPS = [
  {
    label: "Pakaian (S–XXL)",
    value: "clothing",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    label: "Sepatu (38–44)",
    value: "shoes",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
  },
  {
    label: "All Size",
    value: "allsize",
    sizes: ["All Size"],
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildSku(prefix: string, color: string, size: string): string {
  const base = prefix ? slugify(prefix).toUpperCase() : "PRD";
  const c = slugify(color).toUpperCase().slice(0, 4);
  const s = slugify(size).toUpperCase().slice(0, 4);
  return `${base}-${c}-${s}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TagProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  isCustom?: boolean;
}

function Tag({ label, active, onToggle, onRemove, isCustom }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium",
        "border transition-all duration-200 cursor-pointer select-none",
        "leading-none whitespace-nowrap",
        active
          ? [
            "bg-gradient-to-r from-accent/20 to-accent-secondary/15",
            "border-accent/30 text-accent",
            "shadow-[0_0_12px_-4px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(16,185,129,0.15)]",
          ].join(" ")
          : [
            "bg-white/[0.04] border-white/[0.06] text-muted-foreground",
            "hover:bg-white/[0.07] hover:border-white/[0.1] hover:text-foreground",
          ].join(" ")
      )}
      onClick={onToggle}
    >
      {label}
      {isCustom && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "rounded-full p-0.5 -mr-0.5 transition-colors duration-150",
            active
              ? "text-accent/70 hover:text-accent hover:bg-accent/20"
              : "text-muted-dim hover:text-muted-foreground hover:bg-white/[0.1]"
          )}
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

interface AddCustomTagProps {
  placeholder: string;
  onAdd: (value: string) => void;
}

function AddCustomTag({ placeholder, onAdd }: AddCustomTagProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium",
          "border border-dashed border-white/[0.1] text-muted-dim",
          "hover:border-white/[0.18] hover:text-muted-foreground hover:bg-white/[0.04]",
          "transition-all duration-200 leading-none cursor-pointer"
        )}
      >
        <Plus size={10} strokeWidth={2.5} />
        Tambah
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "h-6 w-24 px-2 rounded-lg text-[11px] text-foreground",
          "bg-white/[0.06] border border-accent/30",
          "placeholder:text-muted-dim",
          "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
          "transition-all duration-200"
        )}
      />
      <button
        type="button"
        onClick={handleSubmit}
        className="text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => {
          setValue("");
          setOpen(false);
        }}
        className="text-muted-dim hover:text-muted-foreground transition-colors"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </span>
  );
}

// ─── Variant Table Row ────────────────────────────────────────────────────────

interface VariantTableRowProps {
  row: VariantRow;
  index: number;
  onChange: (index: number, field: keyof VariantRow, value: string | number) => void;
}

function VariantTableRow({ row, index, onChange }: VariantTableRowProps) {
  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150 group">
      {/* Color dot + label */}
      <td className="px-3 py-2.5">
        <span className="text-xs font-medium text-foreground">{row.color}</span>
      </td>

      {/* Size */}
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-block px-2 py-0.5 rounded-md text-[11px] font-medium",
            "bg-white/[0.05] border border-white/[0.06] text-muted-foreground"
          )}
        >
          {row.size}
        </span>
      </td>

      {/* SKU — editable */}
      <td className="px-2 py-2">
        <input
          value={row.sku}
          onChange={(e) => onChange(index, "sku", e.target.value)}
          className={cn(
            "w-full h-7 px-2 rounded-lg text-[11px] font-num text-foreground",
            "bg-white/[0.04] border border-white/[0.06]",
            "placeholder:text-muted-dim",
            "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
            "focus:bg-white/[0.06] transition-all duration-200"
          )}
        />
      </td>

      {/* Stock */}
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          value={row.stock}
          onChange={(e) => onChange(index, "stock", parseInt(e.target.value) || 0)}
          className={cn(
            "w-20 h-7 px-2 rounded-lg text-[11px] font-num text-foreground text-right",
            "bg-white/[0.04] border border-white/[0.06]",
            "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
            "focus:bg-white/[0.06] transition-all duration-200"
          )}
        />
      </td>

      {/* Buy Price */}
      <td className="px-2 py-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-dim pointer-events-none">
            Rp
          </span>
          <input
            type="number"
            min={0}
            value={row.buyPrice}
            onChange={(e) => onChange(index, "buyPrice", parseInt(e.target.value) || 0)}
            className={cn(
              "w-full h-7 pl-7 pr-2 rounded-lg text-[11px] font-num text-foreground text-right",
              "bg-white/[0.04] border border-white/[0.06]",
              "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
              "focus:bg-white/[0.06] transition-all duration-200"
            )}
          />
        </div>
      </td>

      {/* Sell Price */}
      <td className="px-2 py-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-dim pointer-events-none">
            Rp
          </span>
          <input
            type="number"
            min={0}
            value={row.sellPrice}
            onChange={(e) => onChange(index, "sellPrice", parseInt(e.target.value) || 0)}
            className={cn(
              "w-full h-7 pl-7 pr-2 rounded-lg text-[11px] font-num text-foreground text-right",
              "bg-white/[0.04] border border-white/[0.06]",
              "focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/15",
              "focus:bg-white/[0.06] transition-all duration-200"
            )}
          />
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VariantBuilder({
  colors,
  sizes,
  onColorsChange,
  onSizesChange,
  onVariantsChange,
  skuPrefix = "PRD",
}: VariantBuilderProps) {
  // Track custom (user-added) tags separately from preset toggles
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [activeSizeGroup, setActiveSizeGroup] = useState<string | null>(null);

  // Internal variant state — keyed by "color||size" to persist edits across re-renders
  const [variantMap, setVariantMap] = useState<Record<string, VariantRow>>({});

  // ── Derived matrix ────────────────────────────────────────────────────────

  const matrix: VariantRow[] = (() => {
    if (colors.length === 0 || sizes.length === 0) return [];
    const rows: VariantRow[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color}||${size}`;
        const existing = variantMap[key];
        rows.push(
          existing ?? {
            color,
            size,
            sku: buildSku(skuPrefix, color, size),
            stock: 0,
            buyPrice: 0,
            sellPrice: 0,
          }
        );
      }
    }
    return rows;
  })();

  // ── Sync to parent ────────────────────────────────────────────────────────

  useEffect(() => {
    onVariantsChange(matrix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, sizes, variantMap, skuPrefix]);

  // ── Handlers: colors ─────────────────────────────────────────────────────

  function toggleColor(color: string) {
    if (colors.includes(color)) {
      onColorsChange(colors.filter((c) => c !== color));
    } else {
      onColorsChange([...colors, color]);
    }
  }

  function addCustomColor(value: string) {
    if (!customColors.includes(value)) {
      setCustomColors((prev) => [...prev, value]);
    }
    if (!colors.includes(value)) {
      onColorsChange([...colors, value]);
    }
  }

  function removeCustomColor(value: string) {
    setCustomColors((prev) => prev.filter((c) => c !== value));
    onColorsChange(colors.filter((c) => c !== value));
  }

  // ── Handlers: sizes ──────────────────────────────────────────────────────

  function toggleSize(size: string) {
    if (sizes.includes(size)) {
      onSizesChange(sizes.filter((s) => s !== size));
    } else {
      onSizesChange([...sizes, size]);
    }
  }

  function addCustomSize(value: string) {
    if (!customSizes.includes(value)) {
      setCustomSizes((prev) => [...prev, value]);
    }
    if (!sizes.includes(value)) {
      onSizesChange([...sizes, value]);
    }
  }

  function removeCustomSize(value: string) {
    setCustomSizes((prev) => prev.filter((s) => s !== value));
    onSizesChange(sizes.filter((s) => s !== value));
  }

  function applySizeGroup(groupValue: string) {
    const group = SIZE_GROUPS.find((g) => g.value === groupValue);
    if (!group) return;

    if (activeSizeGroup === groupValue) {
      // Deselect the group — remove only those sizes
      const groupSet = new Set(group.sizes as readonly string[]);
      onSizesChange(sizes.filter((s) => !groupSet.has(s)));
      setActiveSizeGroup(null);
    } else {
      // Select group — merge with existing custom sizes
      const merged = Array.from(
        new Set([...sizes.filter((s) => customSizes.includes(s)), ...(group.sizes as readonly string[])])
      );
      onSizesChange(merged);
      setActiveSizeGroup(groupValue);
    }
  }

  // All size tags to display = presets + custom additions
  const allColorTags = [...PRESET_COLORS, ...customColors];
  const allSizeTags = [
    ...SIZE_GROUPS.flatMap((g) => g.sizes as unknown as string[]),
    ...customSizes.filter(
      (s) => !SIZE_GROUPS.flatMap((g) => g.sizes as unknown as string[]).includes(s)
    ),
  ];
  // deduplicate while preserving order
  const uniqueSizeTags = Array.from(new Set(allSizeTags));

  // ── Variant table row change ──────────────────────────────────────────────

  const handleRowChange = useCallback(
    (index: number, field: keyof VariantRow, value: string | number) => {
      const row = matrix[index];
      if (!row) return;
      const key = `${row.color}||${row.size}`;
      setVariantMap((prev) => ({
        ...prev,
        [key]: { ...row, ...prev[key], [field]: value },
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrix]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Color Picker ── */}
      <div
        className={cn(
          "rounded-2xl border border-white/[0.06]",
          "bg-white/[0.02] backdrop-blur-sm",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          "p-4 space-y-3"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Warna
          </p>
          {colors.length > 0 && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                "bg-accent/10 text-accent border border-accent/20"
              )}
            >
              {colors.length} dipilih
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {allColorTags.map((color) => {
            const isCustom = customColors.includes(color);
            return (
              <Tag
                key={color}
                label={color}
                active={colors.includes(color)}
                onToggle={() => toggleColor(color)}
                isCustom={isCustom}
                onRemove={isCustom ? () => removeCustomColor(color) : undefined}
              />
            );
          })}
          <AddCustomTag placeholder="mis. Tosca" onAdd={addCustomColor} />
        </div>
      </div>

      {/* ── Size Picker ── */}
      <div
        className={cn(
          "rounded-2xl border border-white/[0.06]",
          "bg-white/[0.02] backdrop-blur-sm",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          "p-4 space-y-3"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ukuran
          </p>
          {sizes.length > 0 && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                "bg-accent/10 text-accent border border-accent/20"
              )}
            >
              {sizes.length} dipilih
            </span>
          )}
        </div>

        {/* Preset group shortcuts */}
        <div className="flex flex-wrap gap-1.5">
          {SIZE_GROUPS.map((group) => {
            const isActive = activeSizeGroup === group.value;
            return (
              <button
                key={group.value}
                type="button"
                onClick={() => applySizeGroup(group.value)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium",
                  "border transition-all duration-200 cursor-pointer select-none leading-none",
                  isActive
                    ? [
                      "bg-gradient-to-r from-accent-secondary/20 to-accent-tertiary/15",
                      "border-accent-secondary/30 text-accent-secondary",
                      "shadow-[0_0_10px_-4px_rgba(6,182,212,0.3)]",
                    ].join(" ")
                    : [
                      "bg-white/[0.03] border-white/[0.08] text-muted-dim",
                      "hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-muted-foreground",
                    ].join(" ")
                )}
              >
                <Layers size={9} strokeWidth={2} />
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Individual size tags */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {uniqueSizeTags.map((size) => {
            const isCustom = customSizes.includes(size);
            return (
              <Tag
                key={size}
                label={size}
                active={sizes.includes(size)}
                onToggle={() => {
                  // If toggling a preset-group size manually, clear the active group shortcut indicator
                  if (activeSizeGroup !== null) {
                    const groupSizes = SIZE_GROUPS.find(
                      (g) => g.value === activeSizeGroup
                    )?.sizes as string[] | undefined;
                    if (groupSizes?.includes(size)) setActiveSizeGroup(null);
                  }
                  toggleSize(size);
                }}
                isCustom={isCustom}
                onRemove={isCustom ? () => removeCustomSize(size) : undefined}
              />
            );
          })}
          <AddCustomTag placeholder="mis. 45" onAdd={addCustomSize} />
        </div>
      </div>

      {/* ── Variant Matrix Preview ── */}
      {matrix.length > 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-white/[0.06] overflow-hidden",
            "bg-white/[0.015] backdrop-blur-sm",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Varian ({matrix.length})
            </p>
            <span className="text-[10px] text-muted-dim">
              {colors.length} warna × {sizes.length} ukuran
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Warna", "Ukuran", "SKU", "Stok", "H. Beli", "H. Jual"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-3 py-2.5 text-[11px] font-semibold text-muted-dim uppercase tracking-wider whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <VariantTableRow
                    key={`${row.color}||${row.size}`}
                    row={row}
                    index={i}
                    onChange={handleRowChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div
          className={cn(
            "rounded-2xl border border-dashed border-white/[0.08]",
            "bg-white/[0.01] backdrop-blur-sm",
            "p-8 flex flex-col items-center justify-center gap-2 text-center"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center mb-1",
              "bg-white/[0.03] border border-white/[0.06]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            )}
          >
            <Layers size={18} className="text-muted-dim" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Belum ada varian
          </p>
          <p className="text-[11px] text-muted-dim max-w-[220px]">
            Pilih minimal satu warna dan satu ukuran untuk membuat tabel varian
          </p>
        </div>
      )}
    </div>
  );
}
