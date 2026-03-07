# Panduan Penggunaan KasirPro (POS v2)

Selamat datang di panduan resmi penggunaan sistem KasirPro v2. Dokumen ini menjelaskan cara menggunakan berbagai fitur yang tersedia di dalam aplikasi kasir dan backoffice ini.

---

## 1. Memulai Aplikasi & Shift Kasir

Sebelum mulai melayani transaksi, seorang kasir diwajibkan untuk membuka _Shift_.
1. **Login**: Masukkan email dan password akun Anda di halaman login.
2. **Buka Shift**: Arahkan ke menu **Shift** di sidebar kiri. Klik tombol **Buka Shift**, lalu masukkan modal awal/uang kas di laci (Cash in Drawer) saat ini.
3. Setelah shift dibuka, Anda sudah bisa mengakses menu **Kasir** untuk melayani pelanggan.

---

## 2. Menu Kasir (Point of Sale)

Menu utama untuk melakukan transaksi penjualan dengan pelanggan.

### Menambahkan Produk ke Keranjang
- **Pencarian Manual**: Ketik nama produk di kolom pencarian atau filter berdasarkan kategori di tab yang tersedia.
- **Scanner Barcode**: Jika Anda memiliki alat scanner barcode (USB/Bluetooth), Anda bisa langsung men-scan barcode produk. Item akan otomatis masuk ke keranjang. Terdapat juga fitur scanner via WebCam.

### Kelola Keranjang
- Anda dapat mengubah kuantitas (qty) barang dengan menekan tombol plus (`+`) atau minus (`-`).
- Anda bisa memilih pelanggan (Pelanggan Umum atau Member) agar transaksi tercatat di riwayat pembelian mereka.
- **Sistem Tahan Pesanan (Hold Order)**: Jika pelanggan belum siap membayar namun antrean panjang, klik **Simpan Pesanan**. Anda bisa memanggilnya kembali (Restore) nanti dari tab pesanan yang ditahan.

### Pembayaran
1. Klik **Bayar** di ringkasan pesanan.
2. Pilih metode pembayaran: Tunai (Cash), E-Wallet, QRIS, Kartu Debit, Kartu Kredit, atau Transfer Bank.
3. Masukkan jumlah uang yang diterima (nominal pembayaran). Sistem akan otomatis menghitung uang kembalian (jika tunai).
4. Klik **Selesaikan Pembayaran**.
5. Setelah sukses, Anda akan melihat opsi untuk **Cetak Struk** via printer thermal atau mengirimkan **Struk Digital via WhatsApp**.

---

## 3. Pesanan & Retur

- **Riwayat Pesanan**: Melihat semua transaksi yang sudah berhasil, dibatalkan, atau sedang ditahan.
- **Retur / Pengembalian**: Jika ada pelanggan yang mengembalikan barang, Anda bisa mencatatnya di menu ini untuk menyesuaikan stok dan aliran kas keluar (refund).

---

## 4. Manajemen Inventaris (Katalog & Stok)

Gunakan menu ini untuk mengatur database produk toko Anda.

### Menambahkan Produk Baru
1. Masuk ke **Katalog & Stok** lalu pilih tab **Katalog**.
2. Klik **Tambah Produk**.
3. Isi informasi dasar seperti Nama, Kategori, Harga Dasar, dan Harga Modal (COGS).
4. **Varian Produk**: Jika produk memiliki warna atau ukuran (misal: Baju warna Merah ukuran XL), tambahkan sebagai varian baru menggunakan tabel Varian Builder. Masukkan SKU, Harga Jual, Harga Beli, dan Kuota Stok tiap varian secara terpisah.

### Menyesuaikan Stok
- Untuk menambah atau merevisi jumlah stok secara manual, gunakan fitur penyesuaian (_Adjustment_) di tab **Stok**.

---

## 5. Pembelian & Pemasok (Purchase Orders)

- **Pemasok (Supplier)**: Simpan kontak pemasok barang Anda.
- **Pembelian (PO)**: Masukkan nota pembelian / kulakan ke sistem saat ada barang masuk dari pemasok. Stok produk di Katalog akan **otomatis bertambah** sesuai dengan item dan kuantitas yang Anda masukkan di Purchase Order.

---

## 6. Kontak (Member & Karyawan)

- **Pelanggan**: Daftar kontak pelanggan yang pernah berbelanja atau didaftarkan sebagai Member CRM toko.
- **Karyawan**: Khusus pengguna dengan role `Owner` / `Admin`, Anda dapat menambahkan akun staff kasir dan manajer baru melalui menu ini.

---

## 7. Promosi (Diskon)

Fitur untuk mengatur diskon otomatis:
1. Buat Kampanye Promosi (Contoh: "Diskon Lebaran").
2. Tentukan persentase (%) diskon atau potongan harga nominal (Rp).
3. Atur tanggal mulai dan dan berakhir promosi tersebut. Diskon akan otomatis memotong harga saat ditambahkan ke kasir.

---

## 8. Laporan & Keuangan

- **Laporan Penjualan**: Ringkasan total pendapatan, barang terlaris, dan jumlah transaksi harian/bulanan.
- **Laporan Manajemen Kas (Keuangan)**: Menampilkan aliran uang masuk (Penjualan) vs aliran uang keluar (Retur, Pengeluaran).
- **Pengeluaran Operasional**: Catat pengeluaran harian toko seperti biaya listrik, pembelian supplies toko, dsb melalui _Expense Tracker_ di tab Pengeluaran Harian.

---

## 9. Pengaturan & Perangkat Keras

Halaman kontrol utama untuk `Owner`. Disini Anda bisa mengatur:

### Konfigurasi Struk (Receipt)
- Nama Toko, Alamat, Nomor Telepon.
- Pesan _Footer_ (Pesan penutup di bawah struk).
- **Ukuran Kertas**: Sesuaikan jenis printer thermal yang Anda gunakan. Biasanya opsi yang tersedia adalah printer 58mm atau 80mm. 
*(Catatan: Ukuran kertas harus diatur agar desain struk tidak terpotong.)*

### Integrasi Printer Thermal
Aplikasi ini sudah mendukung *Direct-Printing* via browser tanpa install driver (Web Bluetooth & Web USB API).
1. Pastikan fitur didukung oleh Chrome / Edge versi terbaru.
2. Di pengaturan printer, pilih tipe koneksi (USB atau Bluetooth).
3. Klik "Test Print". Browser akan meminta izin `Pairing` ke printer yang terdeteksi.

---
_Panduan ini dibuat untuk KasirPro v2. Silahkan hubungi administrator sistem jika ada kendala akses atau peran/Role permission._
