# Panduan Pengguna KasirPro

Panduan lengkap untuk menggunakan semua fitur KasirPro — sistem Point of Sale dan manajemen inventaris untuk bisnis retail.

---

## Daftar Isi

1. [Login & Akun](#1-login--akun)
2. [Dashboard](#2-dashboard)
3. [Kasir (POS)](#3-kasir-pos)
4. [Produk](#4-produk)
5. [Pesanan & Retur](#5-pesanan--retur)
6. [Pembelian & Pemasok](#6-pembelian--pemasok)
7. [Kontak (Pelanggan & Karyawan)](#7-kontak-pelanggan--karyawan)
8. [Promosi](#8-promosi)
9. [Laporan](#9-laporan)
10. [Shift](#10-shift)
11. [Notifikasi](#11-notifikasi)
12. [Audit](#12-audit)
13. [Pengaturan](#13-pengaturan)
14. [Struk Digital](#14-struk-digital)

---

## 1. Login & Akun

### Cara Login
1. Buka halaman login (`/login`)
2. Masukkan **email** dan **password**
3. Centang "Ingat saya" jika ingin tetap login
4. Klik **Masuk**

### Peran Pengguna

KasirPro memiliki 3 peran dengan hak akses berbeda:

| Fitur | Kasir | Manajer | Owner |
|-------|:-----:|:-------:|:-----:|
| Dashboard | ✓ | ✓ | ✓ |
| Kasir (POS) | ✓ | ✓ | ✓ |
| Pesanan & Retur | ✓ | ✓ | ✓ |
| Produk & Stok | ✗ | ✓ | ✓ |
| Pembelian & Pemasok | ✗ | ✓ | ✓ |
| Kontak | ✓ | ✓ | ✓ |
| Promosi | ✗ | ✓ | ✓ |
| Laporan | ✗ | ✓ | ✓ |
| Shift | ✓ | ✓ | ✓ |
| Notifikasi | ✓ | ✓ | ✓ |
| Audit | ✓ | ✓ | ✓ |
| Pengaturan | ✗ | ✗ | ✓ |

---

## 2. Dashboard

Halaman utama menampilkan ringkasan performa toko Anda.

### Statistik Utama
- **Total Penjualan** — total pendapatan
- **Total Transaksi** — jumlah order
- **Rata-rata per Transaksi** — nilai rata-rata setiap order
- **Nilai Inventaris** — total nilai stok barang

### Grafik & Visualisasi
- **Penjualan Mingguan** — tren 7 hari terakhir
- **Penjualan per Jam** — jam sibuk penjualan
- **Tren Bulanan** — performa per bulan
- **Performa Kategori** — penjualan per kategori produk
- **Metode Pembayaran** — distribusi tunai, debit, QRIS, dll
- **Produk Terlaris** — top produk dengan persentase
- **Pesanan Terbaru** — 5 transaksi terakhir

### Peringatan
- **Stok Rendah** — produk yang stoknya di bawah minimum akan ditampilkan sebagai peringatan

---

## 3. Kasir (POS)

Ini adalah halaman utama untuk melakukan transaksi penjualan.

### Syarat Sebelum Transaksi
- Anda **harus membuka shift** terlebih dahulu sebelum bisa bertransaksi
- Jika shift hari sebelumnya belum ditutup, tutup dulu shift tersebut

### Alur Transaksi

#### Langkah 1: Pilih Produk
- Klik produk dari **grid produk** untuk menambahkan ke keranjang
- Gunakan **bar kategori** di atas untuk filter berdasarkan kategori
- Gunakan **kolom pencarian** untuk cari berdasarkan nama atau brand
- Produk yang **stoknya habis** akan tampil dengan badge "Habis" dan tidak bisa diklik

#### Langkah 2: Pilih Varian (jika ada)
- Pilih **warna** dari opsi yang tersedia
- Pilih **ukuran** dari opsi yang tersedia
- Stok setiap varian ditampilkan secara real-time
- Harga bisa berbeda per varian

#### Langkah 3: Kelola Keranjang
- **Tambah/kurang** jumlah item dengan tombol +/-
- **Hapus item** dengan tombol hapus
- **Kosongkan keranjang** untuk mulai ulang
- Subtotal dihitung otomatis secara real-time

#### Langkah 4: Pilih Pelanggan (Opsional)
- Pilih pelanggan dari dropdown untuk mendapatkan:
  - **Diskon tier** otomatis (Bronze 0%, Silver 2%, Gold 5%, Platinum 10%)
  - **Poin loyalitas** yang bisa ditukar
- Jika tidak dipilih, transaksi dicatat sebagai "Pelanggan Umum"

#### Langkah 5: Promosi & Diskon
- Promosi yang memenuhi syarat akan **otomatis diterapkan**
- Sistem memilih promosi terbaik (diskon terbesar)
- Anda juga bisa memilih promosi secara manual
- Hanya **satu promosi** yang berlaku per transaksi (yang terbesar antara diskon tier atau promosi)

#### Langkah 6: Ongkos Kirim (Opsional)
- Masukkan biaya pengiriman jika pelanggan minta diantar
- Otomatis ditambahkan ke total

#### Langkah 7: Pembayaran
Klik **Bayar** dan pilih metode pembayaran:

| Metode | Keterangan |
|--------|-----------|
| **Tunai** | Masukkan jumlah uang, kembalian dihitung otomatis. Tersedia tombol cepat Rp 50rb, 100rb, 200rb, 500rb |
| **Debit Card** | Pilih **bank** (BCA, MANDIRI, BRI, BNI, CIMB, Lainnya), masukkan **4 digit no. referensi** (opsional). Bank wajib dipilih sebelum konfirmasi |
| **Kredit Card** | Sama seperti Debit — pilih bank + no. referensi opsional |
| **E-Wallet** | Pilih provider: GoPay, OVO, DANA, ShopeePay. Nama provider tersimpan di database |

**Split Payment**: Klik tombol **Split Payment** untuk membagi pembayaran ke beberapa metode. Contoh: Rp 100rb Tunai + Rp 50rb Debit BCA. Detail split tercatat di catatan order.

#### Langkah 8: Struk
Setelah pembayaran berhasil, Anda bisa:
- **Cetak struk** via printer thermal atau browser
- **Kirim via WhatsApp** — untuk pelanggan terdaftar langsung terbuka WhatsApp dengan nomor pelanggan, untuk Pelanggan Umum akan diminta input nomor HP terlebih dahulu
- **Tutup** untuk kembali ke kasir

### Scan Barcode
- Klik ikon **scan barcode** untuk membuka scanner
- Scan barcode produk menggunakan kamera perangkat
- Produk otomatis ditambahkan ke keranjang
- Bisa juga ketik kode barcode/SKU secara manual

### Tahan Transaksi (Hold)
Jika perlu melayani pelanggan lain terlebih dahulu:
1. Klik **Tahan** untuk menyimpan keranjang sementara
2. Lakukan transaksi lain
3. Klik **Transaksi Tertahan** untuk melihat daftar
4. Pilih transaksi yang ditahan untuk melanjutkan
5. Atau hapus jika tidak jadi

---

## 4. Produk

### Tab Katalog

#### Melihat Produk
- Semua produk ditampilkan dalam tabel dengan info: nama, brand, kategori, harga, jumlah varian, stok total, dan status
- Foto produk ditampilkan di samping nama (jika ada)
- Filter berdasarkan **kategori** atau **pencarian nama**
- Klik **Load More** untuk memuat produk berikutnya

#### Tambah Produk Baru
1. Klik tombol **+ Tambah Produk**
2. Isi informasi:
   - **Nama Produk** (wajib)
   - **Brand** (wajib)
   - **Foto Produk** (opsional) — foto otomatis dikompres ke WebP 400x400px (~20KB)
   - **Kategori** (wajib)
   - **Supplier** (opsional)
   - **Deskripsi** (opsional)
   - **Harga Jual** dan **Harga Beli**
3. Pilih tipe produk:

| Tipe | Keterangan |
|------|-----------|
| **Produk Tunggal** | Satu SKU, satu harga. Masukkan barcode dan stok awal |
| **Multi Varian** | Banyak kombinasi warna & ukuran. Gunakan Variant Builder untuk buat semua kombinasi sekaligus |
| **Produk Paket (Bundle)** | Gabungan beberapa produk. Cari dan tambahkan komponen beserta jumlahnya |

4. Klik **Simpan**

#### Edit Produk
- Klik ikon **pensil** pada baris produk
- Ubah informasi yang diperlukan
- Klik **Simpan**

#### Nonaktifkan Produk
- Klik ikon **hapus** pada baris produk
- Produk akan diubah statusnya menjadi "Nonaktif" (tidak muncul di kasir)

#### Upload Foto Produk
- Klik area foto di form produk
- Pilih gambar dari perangkat
- Foto otomatis **dikompres** sebelum diupload:
  - Resize ke maksimum 400x400 piksel
  - Konversi ke format WebP
  - Kualitas 75%
  - Hasil: ~10-25KB per foto (hemat storage)

### Tab Stok
- Lihat total stok per produk dan varian
- **Peringatan stok rendah** — produk di bawah minimum stok ditandai
- **Sesuaikan stok** — ubah jumlah stok manual (tambah/kurang)

### Tab Kategori
- **Lihat semua kategori** beserta jumlah produk per kategori
- **Tambah kategori baru** — masukkan nama dan deskripsi
- **Edit kategori** — ubah nama atau deskripsi
- **Hapus kategori** — hapus kategori (produk di dalamnya harus dipindah dulu)

### Impor & Ekspor

#### Impor CSV
1. Klik tombol **Impor**
2. Pilih file CSV dengan kolom:
   - Nama Produk, SKU, Barcode, Kategori, Brand, Harga Jual, Harga Beli, Stok, Stok Minimum, Status
3. Pilih mode:
   - **Lewati** — lewati jika SKU sudah ada
   - **Perbarui** — update harga dan stok jika SKU sudah ada
4. Klik **Impor**

#### Ekspor CSV
- Klik tombol **Ekspor** untuk download katalog produk sebagai file CSV

### Cetak Label Barcode
1. Centang produk yang ingin dicetak barcodenya
2. Klik **Cetak Barcode**
3. Pilih ukuran label:
   - Kecil (2 per baris)
   - Sedang (3 per baris)
   - Besar (4 per baris)
4. Preview label dan klik **Cetak**
5. Format barcode: CODE128

---

## 5. Pesanan & Retur

### Tab Pesanan

#### Melihat Pesanan
- Semua transaksi ditampilkan dengan: ID Order, tanggal, pelanggan, total, metode bayar, dan status
- **Filter** berdasarkan status: Semua, Selesai, Pending, Dibatalkan
- **Cari** berdasarkan ID order atau nama pelanggan
- Klik pesanan untuk melihat detail lengkap

#### Detail Pesanan
- Daftar item: nama produk, jumlah, harga satuan, subtotal
- Ringkasan: subtotal, diskon, pajak, ongkir, total
- Info pembayaran: metode, **bank/e-wallet** (jika ada), **no. referensi** (jika ada)
- **Uang tunai & kembalian** ditampilkan untuk pembayaran tunai
- **Catatan split payment** ditampilkan jika menggunakan split
- Info kasir dan pelanggan

#### Aksi Pesanan
- **Batalkan pesanan** — ubah status menjadi "Dibatalkan", stok otomatis dikembalikan
- **Cetak struk** — cetak ulang struk
- **Bagikan struk** — dapatkan link struk digital untuk WhatsApp

### Tab Retur

#### Melihat Retur
- Daftar semua pengembalian barang
- Info: ID order asal, alasan retur, jumlah refund, status

#### Proses Retur
- Pilih metode refund: uang tunai atau kredit toko
- Tambahkan catatan admin
- Update status retur
- Stok otomatis dikembalikan setelah retur diproses

---

## 6. Pembelian & Pemasok

### Tab Pembelian (Purchase Order)

#### Melihat PO
- Daftar semua pesanan pembelian ke supplier
- Info: ID PO, supplier, tanggal, status, total, jumlah item

#### Buat Purchase Order
1. Klik **+ Buat PO**
2. Pilih **supplier** dari dropdown
3. Tambahkan item:
   - Pilih varian produk
   - Masukkan jumlah
   - Harga beli otomatis terisi
4. Set **tanggal pengiriman** yang diharapkan
5. Tambahkan **catatan** (opsional)
6. Klik **Simpan**

#### Status Purchase Order
| Status | Keterangan |
|--------|-----------|
| Diproses | PO baru dibuat |
| Dikirim | Barang sedang dikirim supplier |
| Diterima | Barang sudah diterima, stok otomatis bertambah |
| Dibatalkan | PO dibatalkan |

### Tab Pemasok (Supplier)

#### Kelola Supplier
- Lihat daftar semua supplier
- Info: nama, kontak, telepon, email, total order, total belanja

#### Tambah Supplier
1. Klik **+ Tambah Supplier**
2. Isi: nama perusahaan, kontak person, telepon, email, alamat
3. Klik **Simpan**

---

## 7. Kontak (Pelanggan & Karyawan)

### Tab Pelanggan

#### Daftar Pelanggan
- Semua pelanggan terdaftar dengan info: nama, telepon, tier, poin, total belanja

#### Sistem Tier & Loyalitas

| Tier | Poin | Diskon Otomatis |
|------|------|:--------------:|
| Bronze | 0 – 499 | 0% |
| Silver | 500 – 999 | 2% |
| Gold | 1.000 – 1.999 | 5% |
| Platinum | 2.000+ | 10% |

- **Poin** didapat otomatis dari setiap pembelian
- **Tukar poin** sebagai pembayaran di kasir (1 poin = Rp 1)
- **Diskon tier** diterapkan otomatis saat pelanggan dipilih di kasir
- **Progress bar** menunjukkan kemajuan menuju tier berikutnya

#### Tambah Pelanggan
1. Klik **+ Tambah Pelanggan**
2. Isi: nama, telepon, email, alamat, tanggal lahir (opsional)
3. Klik **Simpan**

#### Detail Pelanggan
- Riwayat pembelian lengkap
- Total belanja dan jumlah order
- Info poin dan tier
- Tanggal pembelian terakhir

### Tab Karyawan

#### Daftar Karyawan
- Semua pengguna sistem: nama, email, peran, tanggal bergabung

#### Kelola Peran (Khusus Owner)
- Ubah peran karyawan: Kasir, Manajer, atau Owner
- Perubahan peran berlaku langsung

---

## 8. Promosi

### Jenis Promosi

| Jenis | Contoh | Keterangan |
|-------|--------|------------|
| **Diskon Persentase** | Diskon 10% | Potongan berdasarkan persentase dari harga |
| **Diskon Nominal** | Potongan Rp 50.000 | Potongan harga tetap dalam Rupiah |
| **Beli X Gratis Y** | Beli 2, Gratis 1 Gelang | Beli X item apapun, gratis 1 produk tertentu yang sudah ditentukan |
| **Bundle** | Paket Rp 40.000 | Beberapa produk dijual bersama dengan harga spesial |

### Buat Promosi
1. Klik **+ Tambah Promosi**
2. Isi informasi umum:
   - **Nama promosi** (wajib)
   - **Deskripsi** (opsional)
   - **Jenis** — pilih dari 4 jenis di atas
   - **Tanggal mulai** dan **tanggal berakhir** (wajib)
   - **Aktif** — Ya atau Tidak

3. Isi informasi sesuai jenis:

   **Diskon Persentase:**
   - **Nilai diskon (%)** — contoh: 10 untuk diskon 10%
   - **Min. pembelian** (opsional) — minimum total belanja

   **Diskon Nominal:**
   - **Nilai diskon (Rp)** — contoh: 50000 untuk potongan Rp 50.000
   - **Min. pembelian** (opsional)

   **Beli X Gratis Y:**
   - **Jumlah item yang harus dibeli (X)** — contoh: 2
   - **Produk yang digratiskan** — pilih produk spesifik dari dropdown (wajib)
   - Kasir harus **menambahkan produk gratis ke keranjang**, harga otomatis menjadi Rp 0

   **Bundle:**
   - **Harga bundle (Rp)** — harga total paket
   - **Min. pembelian** (opsional)

4. Pilih **Berlaku Untuk**:
   - **Semua Produk** — promo berlaku untuk semua item
   - **Kategori Tertentu** — centang kategori yang berlaku (contoh: Hijab, Aksesoris)
   - **Produk Tertentu** — centang produk spesifik yang berlaku

5. Klik **Simpan**

### Edit Promosi
- Klik ikon **pensil** pada kartu promosi
- Semua field bisa diubah: nama, nilai, tanggal, berlaku untuk, target, produk gratis, dll
- Klik **Simpan Perubahan**

### Filter Promosi
- **Semua** — tampilkan semua promosi
- **Aktif** — yang sedang berjalan
- **Terjadwal** — belum mulai
- **Berakhir** — sudah lewat

### Cara Kerja di Kasir

**Otomatis:**
- Promosi yang memenuhi syarat **otomatis diterapkan** ke keranjang
- Sistem memilih promosi dengan **diskon terbesar**
- Diskon tier dan diskon promosi **tidak ditumpuk** — yang lebih besar yang berlaku
- Poin loyalitas bisa digunakan **bersamaan** dengan diskon
- Kasir bisa memilih **"Tidak ada promo"** untuk menonaktifkan promosi manual

**Beli X Gratis Y di Kasir:**
1. Kasir menambahkan minimal X item ke keranjang (produk apapun)
2. Kasir menambahkan **produk gratis** ke keranjang
3. Diskon otomatis terhitung — harga produk gratis menjadi Rp 0
4. Jika pelanggan beli 4 item dengan promo "Beli 2 Gratis 1", maka 2 unit produk gratis bisa didapat (jika ada 2 di keranjang)
5. Produk gratis **harus ada di keranjang** — jika tidak ditambahkan, diskon tidak muncul

---

## 9. Laporan

### Tab Keuangan
- **Ringkasan**: total penjualan, jumlah transaksi, rata-rata transaksi, nilai inventaris
- **Laporan Harian**: penjualan hari ini
- **Laporan Bulanan**: tren penjualan per bulan
- **Laba Rugi (P&L)**:
  - Pendapatan kotor
  - Total diskon
  - Pendapatan bersih
  - Harga pokok (HPP/COGS)
  - Laba kotor
  - Beban operasional
  - Laba bersih
  - Margin keuntungan

### Tab Cashflow
- **Rekonsiliasi Harian**: saldo awal, penutupan yang diharapkan vs aktual, selisih
- **Rincian Transaksi**: semua arus kas masuk/keluar
- **Pembagian**: tunai vs non-tunai

### Tab Hutang
- **Hutang Supplier**: jumlah yang harus dibayar ke supplier
- **Status PO**: lunas vs belum bayar

### Tab Pajak
- **Perhitungan pajak** otomatis berdasarkan pengaturan
- **Ringkasan pajak** yang terkumpul

### Ekspor Laporan
- Download laporan sebagai **CSV** atau **Excel**
- Pilih **rentang tanggal** untuk laporan
- Filter berdasarkan kategori, produk, atau pelanggan

---

## 10. Shift

### Buka Shift
1. Buka halaman **Shift**
2. Klik **Buka Shift**
3. Masukkan **saldo awal** (uang tunai di laci kasir)
4. Tambahkan **catatan pembukaan** (opsional)
5. Klik **Buka**

### Selama Shift Aktif
Sistem otomatis mencatat:
- Total penjualan selama shift
- Penjualan tunai vs non-tunai
- Jumlah transaksi

### Tutup Shift
1. Klik **Tutup Shift**
2. Hitung uang tunai di laci kasir
3. Masukkan **saldo aktual**
4. Sistem menampilkan:
   - **Saldo yang diharapkan** (berdasarkan transaksi)
   - **Selisih** (kelebihan/kekurangan)
5. Tambahkan **catatan penutupan** (opsional)
6. Klik **Tutup**

### Riwayat Shift
- Lihat semua shift sebelumnya
- Info: kasir, waktu buka/tutup, saldo, total penjualan, selisih
- Berguna untuk audit dan rekonsiliasi

---

## 11. Notifikasi

### Jenis Notifikasi
| Jenis | Keterangan |
|-------|-----------|
| **Stok Rendah** | Peringatan stok di bawah minimum |
| **Pesanan Baru** | Notifikasi terkait order |
| **Pembayaran** | Alert proses pembayaran |
| **Sistem** | Notifikasi umum sistem |
| **Promo** | Info promosi |

### Prioritas
- **Urgent** (merah) — butuh tindakan segera
- **Tinggi** (oranye) — perlu perhatian
- **Normal** (kuning) — notifikasi biasa
- **Rendah** (abu-abu) — informasi saja

### Kelola Notifikasi
- Filter berdasarkan tab: Semua, Belum Dibaca, Stok, Pesanan, Sistem
- **Tandai sudah dibaca** — per notifikasi atau semua sekaligus
- **Hapus** notifikasi yang tidak diperlukan
- Badge di sidebar menunjukkan jumlah notifikasi belum dibaca

---

## 12. Audit

### Tab Stok Opname
Untuk mencocokkan stok fisik dengan stok di sistem:
1. Buat **stok opname baru**
2. Pilih produk yang akan dihitung
3. Masukkan **jumlah aktual** per varian (warna/ukuran)
4. Sistem menampilkan **selisih** antara stok sistem dan fisik
5. Selesaikan opname untuk mengupdate stok

### Tab Audit Log (Manajer/Owner)
Catatan semua aktivitas di sistem:
- Siapa yang melakukan apa dan kapan
- Aktivitas yang dicatat:
  - Tambah/edit/hapus produk
  - Pembuatan order
  - Penyesuaian stok
  - Perubahan pengaturan
  - Login/logout
- Filter berdasarkan pengguna, aksi, atau tanggal

---

## 13. Pengaturan

*Hanya bisa diakses oleh Owner*

### Informasi Toko
| Field | Keterangan |
|-------|-----------|
| Nama Toko | Nama bisnis Anda |
| Alamat Toko | Alamat lengkap |
| Telepon Toko | Nomor telepon |
| Email Toko | Email bisnis |

### Pajak
| Field | Keterangan |
|-------|-----------|
| Nama Pajak | Label pajak (contoh: "PPN") |
| Tarif Pajak | Persentase (default 11%) |
| Mode Pajak | "Termasuk harga" atau "Ditambahkan ke harga" atau "Tidak ada pajak" |

### Struk
| Field | Keterangan |
|-------|-----------|
| Header Struk | Teks di bagian atas struk |
| Alamat Struk | Alamat yang tampil di struk |
| Footer Struk | Pesan terima kasih di bawah struk |
| Lebar Kertas | 58mm atau 80mm |
| Logo | Tampilkan/sembunyikan logo |

### Printer
| Field | Keterangan |
|-------|-----------|
| Tipe Printer | USB, Bluetooth, atau Browser |
| Target Printer | Nama/alamat printer |

- Gunakan **Test Print** untuk memastikan printer terhubung
- Jika printer USB/Bluetooth gagal, sistem otomatis fallback ke **browser print**

### Manajemen Pengguna
- Lihat semua pengguna dan perannya
- Ubah peran: Kasir ↔ Manajer ↔ Owner

---

## 14. Struk Digital

Setiap transaksi menghasilkan struk digital yang bisa diakses via URL.

### Cara Berbagi Struk
1. Setelah transaksi selesai, klik **WhatsApp**
2. Untuk pelanggan terdaftar: langsung terbuka WhatsApp dengan nomor pelanggan
3. Untuk Pelanggan Umum: masukkan nomor HP terlebih dahulu, lalu klik kirim
4. Pesan WhatsApp berisi link struk digital

### Isi Struk Digital
- Informasi toko (nama, alamat, telepon)
- Nomor order dan tanggal/jam
- Nama kasir dan pelanggan
- Daftar barang dengan harga
- Subtotal, diskon, pajak, ongkir, dan total
- Metode pembayaran (termasuk uang bayar dan kembalian untuk tunai)
- Pesan footer dari toko

### Simpan sebagai PDF
- Buka link struk digital
- Klik **Simpan PDF**
- File PDF otomatis terdownload

---

## Tips & Trik

### Efisiensi di Kasir
- Gunakan **barcode scanner** untuk mempercepat input produk
- Manfaatkan **tombol nominal cepat** (50rb, 100rb, dll) saat pembayaran tunai
- Gunakan fitur **Tahan Transaksi** jika harus melayani pelanggan lain

### Manajemen Stok
- Set **stok minimum** di setiap produk agar notifikasi stok rendah muncul tepat waktu
- Lakukan **stok opname** rutin (mingguan/bulanan) untuk akurasi
- Gunakan **impor CSV** untuk tambah produk massal

### Keuangan
- Selalu **buka dan tutup shift** dengan benar untuk rekonsiliasi yang akurat
- Periksa **selisih kas** di setiap tutup shift
- Review **laporan laba rugi** bulanan untuk memantau kesehatan bisnis

### Pelanggan
- Daftarkan pelanggan tetap untuk membangun **loyalitas**
- Pelanggan dengan tier lebih tinggi mendapat **diskon otomatis**
- Ingatkan pelanggan tentang **poin** yang bisa ditukar

---

*KasirPro — Solusi POS lengkap untuk bisnis retail Anda.*
