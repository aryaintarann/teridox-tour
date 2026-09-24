# PRD — Tour Booking Platform (Single Vendor)

## 1. Ringkasan Proyek

Platform booking tour online untuk satu vendor jasa wisata (sewa mobil + tour dengan sopir), menggantikan alur booking manual (WhatsApp/form statis) dengan sistem booking real-time, pembayaran online, dan dashboard pengelolaan untuk vendor. Menyasar wisatawan lokal dan asing sehingga dibangun dwibahasa (Indonesia/Inggris).

Catatan: proyek ini terpisah dari proyek Bali Trip Driver (Pak Rama).

## 2. Tujuan

- Menggantikan booking manual dengan sistem yang mencegah bentrok jadwal (double-booking)
- Menerima pembayaran online langsung di platform
- Memudahkan vendor mengelola paket, ketersediaan, dan booking masuk tanpa developer
- Menjangkau wisatawan asing lewat dukungan dwibahasa

## 3. Target Pengguna


| Peran                | Deskripsi                                                         |
| -------------------- | ----------------------------------------------------------------- |
| Wisatawan (customer) | Wisatawan lokal &amp; asing yang mencari &amp; memesan paket tour |
| Vendor/Admin         | Pemilik jasa tour yang mengelola paket, ketersediaan, dan booking |


## 4. Lingkup (Scope)

**Termasuk:** single-vendor, booking real-time, pembayaran online (DOKU), akun wajib, dashboard admin, translate otomatis. **Tidak termasuk (di luar MVP):** marketplace multi-vendor, aplikasi mobile native, sistem loyalti/poin, live chat.

## 5. Fitur — Sisi Pelanggan

1. **Beranda** — hero, paket populer, testimoni, toggle bahasa ID/EN
2. **Daftar Paket Tour** — filter kategori &amp; harga, grid paket
3. **Detail Paket** — galeri foto, deskripsi, itinerary, termasuk/tidak termasuk, kalender ketersediaan
4. **Register** — nama, email, no. telepon, password
5. **Login** — email/password, lupa password
6. **Booking** — pilih tanggal (kalender, tanggal penuh disabled), jumlah peserta, lokasi jemput, ringkasan harga
7. **Pembayaran** — integrasi DOKU (kartu, VA, e-wallet, QRIS)
8. **Konfirmasi Booking** — kode booking, ringkasan
9. **Dashboard Akun Saya** — riwayat booking &amp; status, edit profil
10. **Detail Booking Saya** — invoice, status pembayaran, kontak vendor via WA

## 6. Fitur — Dashboard Admin/Vendor

1. **Login Admin** — terpisah dari akun pelanggan
2. **Kelola Paket Tour** — CRUD paket, foto, harga, itinerary
3. **Form Tambah/Edit Paket** — input Bahasa Indonesia + tombol "Terjemahkan Otomatis" (hasil EN dapat diedit sebelum publish)
4. **Kelola Ketersediaan** — kalender per paket, blokir tanggal penuh/libur
5. **Kelola Booking &amp; Pembayaran** — filter status, detail transaksi DOKU, konfirmasi/tolak booking
6. **Laporan Ringkas** — total booking, pendapatan, perbandingan wisatawan lokal vs asing per periode

## 7. Alur Utama (User Flow)

**Booking (pelanggan):** Cari paket → lihat detail → login/register (wajib) → pilih tanggal &amp; jumlah peserta → ringkasan → bayar via DOKU → konfirmasi → status tersimpan di dashboard akun.

**Kelola booking (admin):** Login admin → notifikasi booking baru masuk → cek detail &amp; status pembayaran → konfirmasi atau tolak → status ter-update dan pelanggan menerima notifikasi.

## 8. Notifikasi

- Email: konfirmasi booking, konfirmasi pembayaran, booking dikonfirmasi vendor, reminder H-1 (dwibahasa sesuai preferensi user)
- WhatsApp: konfirmasi booking &amp; reminder untuk pasar lokal

## 9. Persyaratan Non-Fungsional

- Tidak boleh terjadi double-booking pada tanggal &amp; paket yang sama
- Callback pembayaran DOKU harus idempotent (tidak diproses dua kali untuk transaksi yang sama)
- Waktu muat halaman utama &lt; 2 detik
- Responsive (desktop &amp; mobile)
- Semua konten paket tersedia dalam ID &amp; EN

## 10. Metrik Keberhasilan (awal)

- Jumlah booking berhasil per bulan
- Tingkat konversi dari halaman detail paket ke booking selesai
- Rasio wisatawan lokal vs asing

## 11. Referensi Terkait

Lihat [`ARCHITECTURE.md`](http://ARCHITECTURE.md) untuk detail teknis (tech stack, skema database, integrasi pihak ketiga).