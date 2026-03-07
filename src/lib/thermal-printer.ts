/**
 * Thermal Printer Utility — ESC/POS Commands + WebUSB / Web Bluetooth / Network
 *
 * Supports three connection types:
 * - USB: via WebUSB API (Chromium-based browsers only, HTTPS/localhost)
 * - Bluetooth: via Web Bluetooth API (Chromium-based, HTTPS/localhost)
 * - Network (LAN): via server-side TCP through /api/print route
 */

// ── ESC/POS Command Constants ─────────────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: [ESC, 0x40], // ESC @ — Initialize printer
  LF: [LF], // Line feed
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [GS, 0x21, 0x01], // Double height
  DOUBLE_WIDTH_ON: [GS, 0x21, 0x10], // Double width
  DOUBLE_ON: [GS, 0x21, 0x11], // Double width + height
  SIZE_NORMAL: [GS, 0x21, 0x00], // Normal size
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  CUT: [GS, 0x56, 0x01], // Partial cut
  FULL_CUT: [GS, 0x56, 0x00],
  FEED_3: [ESC, 0x64, 0x03], // Feed 3 lines
  FEED_5: [ESC, 0x64, 0x05], // Feed 5 lines
  CASH_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa], // Open cash drawer
};

// ── Text Encoder ─────────────────────────────────────────────────────────────
const textEncoder = new TextEncoder();

function text(str: string): number[] {
  return Array.from(textEncoder.encode(str));
}

function line(str: string): number[] {
  return [...text(str), ...CMD.LF];
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str.substring(0, width) : str + " ".repeat(width - str.length);
}

function padLeft(str: string, width: number): string {
  return str.length >= width ? str.substring(0, width) : " ".repeat(width - str.length) + str;
}

function row(left: string, right: string, width: number): string {
  const rightLen = right.length;
  const leftMax = width - rightLen - 1;
  return padRight(left, leftMax) + " " + right;
}

function separator(width: number, char = "-"): string {
  return char.repeat(width);
}

// ── Receipt Data Types ────────────────────────────────────────────────────────
export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptPrintData {
  orderId: string;
  items: ReceiptItem[];
  customerName: string;
  subtotal: number;
  discountAmount: number;
  tax: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  cashPaid?: number;
  changeAmount?: number;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptHeader: string;
  receiptFooter: string;
}

export interface PrinterConfig {
  type: "usb" | "bluetooth" | "network";
  target: string; // Printer name for USB/BT, IP address for network
  paperWidth: "58" | "80";
}

// ── Build ESC/POS Receipt Commands ────────────────────────────────────────────
export function buildReceiptCommands(data: ReceiptPrintData, paperWidth: "58" | "80" = "58"): Uint8Array {
  const W = paperWidth === "80" ? 48 : 32; // characters per line
  const fmtR = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const cmds: number[] = [];

  const push = (...bytes: number[][]) => {
    for (const b of bytes) cmds.push(...b);
  };

  // Initialize
  push(CMD.INIT);

  // Header — centered, bold, double height
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_HEIGHT_ON);
  push(line(data.receiptHeader || data.storeName));
  push(CMD.SIZE_NORMAL, CMD.BOLD_OFF);

  if (data.storeAddress) push(line(data.storeAddress));
  if (data.storePhone) push(line(data.storePhone));

  // Separator
  push(CMD.ALIGN_LEFT);
  push(line(separator(W, "=")));

  // Order info
  push(line(`No   : ${data.orderId}`));
  push(line(`Tgl  : ${new Date().toLocaleString("id-ID")}`));
  push(line(`Plgn : ${data.customerName}`));
  push(line(`Bayar: ${data.paymentMethod}`));
  push(line(separator(W)));

  // Items
  for (const item of data.items) {
    push(line(item.name));
    const qtyPrice = `  ${item.qty} x ${fmtR(item.price)}`;
    const itemTotal = fmtR(item.qty * item.price);
    push(line(row(qtyPrice, itemTotal, W)));
  }

  push(line(separator(W)));

  // Totals
  push(line(row("Subtotal", fmtR(data.subtotal), W)));

  if (data.discountAmount > 0) {
    push(line(row("Diskon", `-${fmtR(data.discountAmount)}`, W)));
  }

  push(line(row("PPN", fmtR(data.tax), W)));

  if (data.shippingFee > 0) {
    push(line(row("Ongkir", fmtR(data.shippingFee), W)));
  }

  push(line(separator(W, "=")));

  // Total — bold
  push(CMD.BOLD_ON);
  push(line(row("TOTAL", fmtR(data.total), W)));
  push(CMD.BOLD_OFF);

  // Cash change
  if (data.cashPaid && data.changeAmount && data.changeAmount > 0) {
    push(line(row("Dibayar", fmtR(data.cashPaid), W)));
    push(line(row("Kembali", fmtR(data.changeAmount), W)));
  }

  push(line(separator(W)));

  // Footer — centered
  push(CMD.ALIGN_CENTER);
  push(line(data.receiptFooter || "Terima kasih!"));
  push(CMD.LF);

  // Feed and cut
  push(CMD.FEED_5, CMD.CUT);

  return new Uint8Array(cmds);
}

// ── Build Test Page Commands ──────────────────────────────────────────────────
export function buildTestPageCommands(paperWidth: "58" | "80" = "58"): Uint8Array {
  const W = paperWidth === "80" ? 48 : 32;
  const cmds: number[] = [];
  const push = (...bytes: number[][]) => {
    for (const b of bytes) cmds.push(...b);
  };

  push(CMD.INIT);
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_ON);
  push(line("TEST PRINT"));
  push(CMD.SIZE_NORMAL, CMD.BOLD_OFF);
  push(CMD.LF);
  push(line("Printer berhasil terhubung!"));
  push(line(separator(W)));
  push(line(`Lebar kertas: ${paperWidth}mm`));
  push(line(`Karakter/baris: ${W}`));
  push(line(`Waktu: ${new Date().toLocaleString("id-ID")}`));
  push(line(separator(W)));
  push(CMD.ALIGN_LEFT);
  push(line(row("Kiri", "Kanan", W)));
  push(CMD.BOLD_ON);
  push(line("Bold text"));
  push(CMD.BOLD_OFF);
  push(CMD.UNDERLINE_ON);
  push(line("Underline text"));
  push(CMD.UNDERLINE_OFF);
  push(line(separator(W)));
  push(CMD.ALIGN_CENTER);
  push(line("=== SELESAI ==="));
  push(CMD.FEED_5, CMD.CUT);

  return new Uint8Array(cmds);
}

// ── WebUSB Printer ────────────────────────────────────────────────────────────
let cachedUsbDevice: USBDevice | null = null;

export async function connectUSBPrinter(): Promise<USBDevice> {
  if (cachedUsbDevice) {
    try {
      await cachedUsbDevice.open();
    } catch {
      // Device may have been disconnected
    }
    if (cachedUsbDevice.opened) return cachedUsbDevice;
  }

  const device = await navigator.usb.requestDevice({
    filters: [
      { classCode: 7 }, // Printer class
    ],
  });

  await device.open();

  // Select configuration if needed
  if (device.configuration === null && device.configurations.length > 0) {
    await device.selectConfiguration(device.configurations[0].configurationValue);
  }

  // Find printer interface
  const iface = device.configuration?.interfaces.find((i) =>
    i.alternates.some((a) => a.interfaceClass === 7)
  );

  if (!iface) throw new Error("Printer interface tidak ditemukan pada perangkat USB");

  await device.claimInterface(iface.interfaceNumber);

  cachedUsbDevice = device;
  return device;
}

export async function printViaUSB(data: Uint8Array): Promise<void> {
  const device = await connectUSBPrinter();

  // Find the OUT endpoint
  const iface = device.configuration?.interfaces.find((i) =>
    i.alternates.some((a) => a.interfaceClass === 7)
  );
  const alt = iface?.alternates.find((a) => a.interfaceClass === 7);
  const endpoint = alt?.endpoints.find((e) => e.direction === "out");

  if (!endpoint) throw new Error("USB endpoint OUT tidak ditemukan");

  // Send data in chunks (some printers have buffer limits)
  const CHUNK_SIZE = 512;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await device.transferOut(endpoint.endpointNumber, chunk);
  }
}

// ── Web Bluetooth Printer ─────────────────────────────────────────────────────
let cachedBtDevice: BluetoothDevice | null = null;
let cachedBtCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

// Common Bluetooth printer service/characteristic UUIDs
const BT_PRINTER_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
const BT_PRINTER_CHAR = "00002af1-0000-1000-8000-00805f9b34fb";
// Alternative UUIDs used by some printers
const BT_SERIAL_SERVICE = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
const BT_SERIAL_CHAR = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f";

export async function connectBluetoothPrinter(): Promise<BluetoothRemoteGATTCharacteristic> {
  if (cachedBtCharacteristic) {
    try {
      // Check if still connected
      if (cachedBtDevice?.gatt?.connected) return cachedBtCharacteristic;
    } catch {
      // Fall through to reconnect
    }
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [BT_PRINTER_SERVICE, BT_SERIAL_SERVICE],
  });

  const server = await device.gatt!.connect();

  // Try known service UUIDs
  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  for (const [svcId, charId] of [
    [BT_PRINTER_SERVICE, BT_PRINTER_CHAR],
    [BT_SERIAL_SERVICE, BT_SERIAL_CHAR],
  ]) {
    try {
      const service = await server.getPrimaryService(svcId);
      characteristic = await service.getCharacteristic(charId);
      break;
    } catch {
      continue;
    }
  }

  if (!characteristic) {
    // Try to discover services
    const services = await server.getPrimaryServices();
    for (const svc of services) {
      try {
        const chars = await svc.getCharacteristics();
        const writableChar = chars.find(
          (c) => c.properties.write || c.properties.writeWithoutResponse
        );
        if (writableChar) {
          characteristic = writableChar;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (!characteristic) throw new Error("Bluetooth printer characteristic tidak ditemukan");

  cachedBtDevice = device;
  cachedBtCharacteristic = characteristic;
  return characteristic;
}

export async function printViaBluetooth(data: Uint8Array): Promise<void> {
  const characteristic = await connectBluetoothPrinter();

  // BLE has MTU limits, typically 20 bytes for write, up to 512 with negotiation
  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValueWithResponse(chunk);
    }
    // Small delay between chunks for BLE stability
    await new Promise((r) => setTimeout(r, 20));
  }
}

// ── Network Printer (via API Route) ──────────────────────────────────────────
export async function printViaNetwork(data: Uint8Array, ipAddress: string): Promise<void> {
  // Parse IP and optional port (default 9100)
  let host = ipAddress;
  let port = 9100;
  if (ipAddress.includes(":")) {
    const parts = ipAddress.split(":");
    host = parts[0];
    port = parseInt(parts[1]) || 9100;
  }

  const response = await fetch("/api/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host,
      port,
      data: Array.from(data), // Convert Uint8Array to regular array for JSON
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Gagal mengirim ke printer" }));
    throw new Error(err.error || "Gagal mengirim ke printer jaringan");
  }
}

// ── Unified Print Function ────────────────────────────────────────────────────
export async function printReceipt(
  data: Uint8Array,
  config: PrinterConfig
): Promise<void> {
  switch (config.type) {
    case "usb":
      await printViaUSB(data);
      break;
    case "bluetooth":
      await printViaBluetooth(data);
      break;
    case "network":
      await printViaNetwork(data, config.target);
      break;
    default:
      throw new Error(`Tipe printer tidak dikenal: ${config.type}`);
  }
}

// ── Browser Print Fallback ────────────────────────────────────────────────────
export function printViaBrowser(data: ReceiptPrintData, paperWidth: "58" | "80" = "58"): void {
  const fmtR = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;

  const widthMm = paperWidth === "80" ? "80mm" : "58mm";

  printWindow.document.write(`
    <html><head>
      <title>Struk ${data.orderId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { 
          font-family: 'Inter', system-ui, sans-serif; 
          font-size: 12px; 
          width: ${widthMm}; 
          margin: 0 auto; 
          padding: 12px; 
          color: #111827;
          background: #fff;
          line-height: 1.5;
        }
        * { box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 16px; }
        .store-title { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; color: #000; }
        .store-subtitle { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
        .divider { border-top: 1px dashed #d1d5db; margin: 12px 0; }
        .meta { font-size: 11px; color: #4b5563; margin-bottom: 12px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .meta-label { color: #6b7280; }
        .meta-value { font-weight: 500; color: #111827; }
        .item-list { margin-bottom: 12px; }
        .item { margin-bottom: 8px; }
        .item-name { font-weight: 600; margin-bottom: 2px; color: #111827; }
        .row { display: flex; justify-content: space-between; align-items: center; }
        .item-qty-price { font-size: 11px; color: #6b7280; }
        .item-total { font-weight: 500; color: #111827; }
        .summary { margin-top: 12px; font-size: 12px; color: #4b5563; }
        .summary .row { margin-bottom: 6px; }
        .summary-label { color: #6b7280; }
        .summary-value { font-weight: 500; color: #111827; }
        .discount-value { color: #ef4444; }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 16px; 
          font-weight: 700; 
          padding: 10px 0; 
          border-top: 2px solid #000; 
          border-bottom: 2px solid #000; 
          margin: 12px 0; 
          color: #000; 
        }
        .payment-details { font-size: 12px; margin-top: 12px; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 24px; font-weight: 500; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head><body>
      
      <div class="header">
        <div class="store-title">${data.receiptHeader || data.storeName}</div>
        ${data.storeAddress ? `<div class="store-subtitle">${data.storeAddress}</div>` : ""}
        ${data.storePhone ? `<div class="store-subtitle">${data.storePhone}</div>` : ""}
      </div>
      
      <div class="divider"></div>
      
      <div class="meta">
        <div class="meta-row">
          <span class="meta-label">No. Order</span>
          <span class="meta-value">${data.orderId.substring(0, 16)}${data.orderId.length > 16 ? '...' : ''}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Tanggal</span>
          <span class="meta-value">${new Date().toLocaleString("id-ID", { dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Pelanggan</span>
          <span class="meta-value">${data.customerName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Metode</span>
          <span class="meta-value">${data.paymentMethod}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="item-list">
        ${data.items.map((i) => `
          <div class="item">
            <div class="item-name">${i.name}</div>
            <div class="row">
              <span class="item-qty-price">${i.qty} x ${fmtR(i.price)}</span>
              <span class="item-total">${fmtR(i.qty * i.price)}</span>
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="divider"></div>
      
      <div class="summary">
        <div class="row"><span class="summary-label">Subtotal</span><span class="summary-value">${fmtR(data.subtotal)}</span></div>
        ${data.discountAmount > 0 ? `<div class="row"><span class="summary-label">Diskon</span><span class="summary-value discount-value">-${fmtR(data.discountAmount)}</span></div>` : ""}
        <div class="row"><span class="summary-label">PPN</span><span class="summary-value">${fmtR(data.tax)}</span></div>
        ${data.shippingFee > 0 ? `<div class="row"><span class="summary-label">Ongkir</span><span class="summary-value">${fmtR(data.shippingFee)}</span></div>` : ""}
      </div>
      
      <div class="total-row">
        <span>TOTAL</span>
        <span>${fmtR(data.total)}</span>
      </div>
      
      <div class="payment-details summary">
      ${data.cashPaid && data.changeAmount !== undefined ? `
        <div class="row"><span class="summary-label">Uang Tunai</span><span class="summary-value">${fmtR(data.cashPaid)}</span></div>
        <div class="row"><span class="summary-label">Kembalian</span><span class="summary-value">${fmtR(data.changeAmount)}</span></div>
      ` : ""}
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">${data.receiptFooter || "Terima kasih atas kunjungan Anda!"}</div>
      
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ── Feature Detection ─────────────────────────────────────────────────────────
export function isWebUSBSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function disconnectUSB(): void {
  if (cachedUsbDevice?.opened) {
    cachedUsbDevice.close().catch(() => { });
  }
  cachedUsbDevice = null;
}

export function disconnectBluetooth(): void {
  if (cachedBtDevice?.gatt?.connected) {
    cachedBtDevice.gatt.disconnect();
  }
  cachedBtDevice = null;
  cachedBtCharacteristic = null;
}

// ── Label Size Presets ────────────────────────────────────────────────────────
export interface LabelSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const LABEL_PRESETS: LabelSize[] = [
  { id: "40x30", label: "40 × 30 mm", widthMm: 40, heightMm: 30 },
  { id: "50x25", label: "50 × 25 mm", widthMm: 50, heightMm: 25 },
  { id: "50x30", label: "50 × 30 mm", widthMm: 50, heightMm: 30 },
  { id: "60x40", label: "60 × 40 mm", widthMm: 60, heightMm: 40 },
];

/**
 * Convert an HTMLCanvasElement to ESC/POS raster bitmap commands (GS v 0).
 * The canvas is resized to fit the thermal printer's dot width.
 *
 * Thermal printers typically have 8 dots/mm (203 DPI).
 * So 58mm paper ≈ 384 dots wide, 80mm paper ≈ 576 dots wide.
 *
 * For label printing, we scale the canvas to fit the label width in dots,
 * then convert each pixel row to bytes (8 pixels per byte, MSB first).
 */
export function buildBarcodeLabelCommands(
  sourceCanvas: HTMLCanvasElement,
  paperWidth: "58" | "80" = "58"
): Uint8Array {
  const DPI = 8; // dots per mm for most thermal printers
  const maxWidthDots = paperWidth === "80" ? 576 : 384;

  // Scale canvas to fit printer width
  const scale = maxWidthDots / sourceCanvas.width;
  const printW = maxWidthDots;
  const printH = Math.round(sourceCanvas.height * scale);

  // Create a scaled canvas
  const printCanvas = document.createElement("canvas");
  printCanvas.width = printW;
  printCanvas.height = printH;
  const pCtx = printCanvas.getContext("2d")!;
  pCtx.fillStyle = "#fff";
  pCtx.fillRect(0, 0, printW, printH);
  pCtx.drawImage(sourceCanvas, 0, 0, printW, printH);

  // Get pixel data
  const imageData = pCtx.getImageData(0, 0, printW, printH);
  const pixels = imageData.data; // RGBA

  // Width in bytes (8 pixels per byte)
  const bytesPerRow = Math.ceil(printW / 8);

  // Convert to monochrome bitmap rows
  const bitmapRows: number[][] = [];
  for (let y = 0; y < printH; y++) {
    const row: number[] = [];
    for (let byteIdx = 0; byteIdx < bytesPerRow; byteIdx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < printW) {
          const pixelOffset = (y * printW + x) * 4;
          const r = pixels[pixelOffset];
          const g = pixels[pixelOffset + 1];
          const b = pixels[pixelOffset + 2];
          // Convert to grayscale and threshold (< 128 = black = 1)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gray < 128) {
            byte |= (0x80 >> bit); // MSB first
          }
        }
      }
      row.push(byte);
    }
    bitmapRows.push(row);
  }

  // Build ESC/POS commands
  const cmds: number[] = [];

  // Initialize
  cmds.push(...CMD.INIT);

  // Set line spacing to 0 for continuous image
  cmds.push(ESC, 0x33, 0x00); // ESC 3 n — set line spacing to n dots

  // Center align
  cmds.push(...CMD.ALIGN_CENTER);

  // Print using GS v 0 — raster bit image
  // GS v 0 m xL xH yL yH d1...dk
  // m = 0: normal, 1: double-width, 2: double-height, 3: double both
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = printH & 0xff;
  const yH = (printH >> 8) & 0xff;

  cmds.push(GS, 0x76, 0x30, 0x00, xL, xH, yL, yH);

  // Append all bitmap data
  for (const row of bitmapRows) {
    cmds.push(...row);
  }

  // Reset line spacing
  cmds.push(ESC, 0x32); // ESC 2 — default line spacing

  // Feed and cut
  cmds.push(...CMD.FEED_3, ...CMD.CUT);

  return new Uint8Array(cmds);
}
