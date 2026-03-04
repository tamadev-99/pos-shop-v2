import { NextRequest, NextResponse } from "next/server";
import * as net from "net";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port = 9100, data } = body;

    if (!host || !data) {
      return NextResponse.json(
        { error: "Parameter 'host' dan 'data' diperlukan" },
        { status: 400 }
      );
    }

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(host)) {
      return NextResponse.json(
        { error: "Format alamat IP tidak valid" },
        { status: 400 }
      );
    }

    // Convert array back to Buffer
    const buffer = Buffer.from(data);

    // Send to printer via raw TCP socket
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Koneksi ke printer timeout (5 detik)"));
      }, 5000);

      socket.connect(port, host, () => {
        socket.write(buffer, (err) => {
          clearTimeout(timeout);
          if (err) {
            socket.destroy();
            reject(new Error(`Gagal mengirim data: ${err.message}`));
          } else {
            // Give the printer a moment to process
            setTimeout(() => {
              socket.end();
              resolve();
            }, 500);
          }
        });
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`Koneksi printer gagal: ${err.message}`));
      });

      socket.on("close", () => {
        clearTimeout(timeout);
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
