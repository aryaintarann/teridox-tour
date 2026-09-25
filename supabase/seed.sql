-- Sample catalogue from the design prototype. Run after the migrations.
-- Ratings/review counts are vendor-entered; images are placeholders, replace them from the vendor console.
with p as (
  insert into public.packages
    (slug, destination, duration_days, title_id, title_en, description_id, description_en,
     includes_id, includes_en, excludes_id, excludes_en,
     price, capacity, max_participants, rating, review_count, cover_image_url)
  values
    ('sailing-komodo-private-phinisi', 'Labuan Bajo', 3,
     'Sailing Komodo Private Phinisi', 'Sailing Komodo Private Phinisi',
     'Tiga hari menyusuri Taman Nasional Komodo dengan kapal phinisi privat berkapasitas maksimal delapan tamu. Kabin ber-AC, kru lengkap, dan pemandu selam bersertifikat di atas kapal. Rute mengikuti arus, bukan jam tetap.',
     'Three days across Komodo National Park aboard a private phinisi with a maximum of eight guests. Air-conditioned cabins, a full crew, and a certified dive guide on board. The itinerary follows the tide, not a fixed clock.',
     '{"Kabin privat ber-AC","Seluruh makan dan air minum di kapal","Perlengkapan snorkeling dan kayak","Tiket taman nasional dan ranger","Penjemputan bandara atau hotel","Pemandu selam bersertifikat"}',
     '{"Private air-conditioned cabin","All meals and drinking water on board","Snorkelling gear and kayak","National park and ranger fees","Airport or hotel pickup","Certified dive guide"}',
     '{"Tiket pesawat ke Labuan Bajo","Asuransi perjalanan","Minuman beralkohol","Tip untuk kru","Kursus sertifikasi selam"}',
     '{"Flights to Labuan Bajo","Travel insurance","Alcoholic drinks","Crew gratuity","Dive certification course"}',
     18500000, 1, 8, 4.9, 128, 'https://picsum.photos/seed/teridox-komodo-phinisi/1600/1100'),
    ('nusa-penida-luxury-day-cruise', 'Bali', 1,
     'Nusa Penida Luxury Day Cruise', 'Nusa Penida Luxury Day Cruise',
     'Satu hari mengelilingi Nusa Penida dengan katamaran dua belas kursi, dua titik snorkeling, dan makan siang di Crystal Bay.',
     'A single day around Nusa Penida on a twelve-seat catamaran, with two snorkelling stops and a late lunch at Crystal Bay.',
     '{"Katamaran privat","Makan siang","Perlengkapan snorkeling","Penjemputan hotel"}', '{"Private catamaran","Lunch","Snorkelling gear","Hotel pickup"}',
     '{"Asuransi perjalanan","Tip untuk kru"}', '{"Travel insurance","Crew gratuity"}',
     4200000, 2, 8, 4.8, 211, 'https://picsum.photos/seed/teridox-nusa-penida/1600/1100'),
    ('ubud-culture-wellness-retreat', 'Bali', 4,
     'Ubud Culture & Wellness Retreat', 'Ubud Culture & Wellness Retreat',
     'Empat hari di Ubud dengan latihan pagi, kunjungan pura, dan sore panjang di rumah keluarga di Petulu.',
     'Four days in Ubud built around morning practice, temple mornings and long afternoons at a family compound in Petulu.',
     '{"Akomodasi 3 malam","Sarapan dan makan malam","Mobil + sopir selama trip"}', '{"3 nights accommodation","Breakfast and dinner","Car and driver throughout"}',
     '{"Tiket pesawat","Asuransi perjalanan"}', '{"Flights","Travel insurance"}',
     12900000, 2, 8, 4.9, 96, 'https://picsum.photos/seed/teridox-ubud/1600/1100'),
    ('padar-sunrise-pink-beach-explorer', 'Labuan Bajo', 2,
     'Padar Sunrise & Pink Beach Explorer', 'Padar Sunrise & Pink Beach Explorer',
     'Perjalanan semalam ke Padar untuk pendakian matahari terbit, lalu Pink Beach dan Manta Point sebelum kembali ke pelabuhan.',
     'An overnight run to Padar for the sunrise climb, then Pink Beach and Manta Point before returning to harbour.',
     '{"Kabin di kapal","Seluruh makan di kapal","Tiket taman nasional"}', '{"Cabin on board","All meals on board","National park fees"}',
     '{"Tiket pesawat","Tip untuk kru"}', '{"Flights","Crew gratuity"}',
     9750000, 2, 8, 4.7, 143, 'https://picsum.photos/seed/teridox-padar/1600/1100'),
    ('bali-highlands-volcano-coffee-estate', 'Bali', 1,
     'Bali Highlands Volcano & Coffee Estate', 'Bali Highlands Volcano & Coffee Estate',
     'Kintamani dari tepi kaldera, perkebunan kopi aktif, dan pemandian air panas di tepi timur Danau Batur.',
     'Kintamani from the rim, a working coffee estate, and the hot springs on the eastern shore of Lake Batur.',
     '{"Mobil + sopir","Makan siang","Tiket pemandian air panas"}', '{"Car and driver","Lunch","Hot spring entry"}',
     '{"Tip untuk sopir"}', '{"Driver gratuity"}',
     3450000, 3, 8, 4.6, 187, 'https://picsum.photos/seed/teridox-batur/1600/1100'),
    ('komodo-dive-expedition-liveaboard', 'Labuan Bajo', 5,
     'Komodo Dive Expedition Liveaboard', 'Komodo Dive Expedition Liveaboard',
     'Dua belas penyelaman dalam lima hari di Batu Bolong, Castle Rock, dan Crystal Rock, termasuk nitrox.',
     'Twelve dives over five days across Batu Bolong, Castle Rock and Crystal Rock, with nitrox included throughout.',
     '{"12 penyelaman dengan nitrox","Kabin privat","Seluruh makan di kapal","Tiket taman nasional"}', '{"12 dives with nitrox","Private cabin","All meals on board","National park fees"}',
     '{"Sewa alat selam","Asuransi selam"}', '{"Dive equipment rental","Dive insurance"}',
     27000000, 1, 8, 5.0, 64, 'https://picsum.photos/seed/teridox-komodo-dive/1600/1100')
  returning id, slug
)
insert into public.package_itinerary (package_id, sort_order, time_label, title_id, title_en, desc_id, desc_en)
select p.id, i.sort_order, '', i.title_id, i.title_en, i.desc_id, i.desc_en
from p join (values
  ('sailing-komodo-private-phinisi', 0, 'Labuan Bajo → Kelor & Menjaga', 'Labuan Bajo → Kelor & Menjaga',
   'Naik kapal pukul 09.00, makan siang di perjalanan, snorkeling sore di Menjaga, dan malam pertama berlabuh di Sebayur.',
   'Board at 09:00, lunch under way, an afternoon snorkel at Menjaga and the first night anchored off Sebayur.'),
  ('sailing-komodo-private-phinisi', 1, 'Padar, Pink Beach, Komodo', 'Padar, Pink Beach, Komodo',
   'Berangkat pukul 04.30 menuju punggungan Padar, lanjut Pink Beach dan trekking bersama ranger di Pulau Komodo sebelum makan malam di dek.',
   'A 04:30 start for the Padar ridge, then Pink Beach and a ranger walk on Komodo Island before dinner on deck.'),
  ('sailing-komodo-private-phinisi', 2, 'Manta Point → pelabuhan', 'Manta Point → harbour',
   'Drift pagi bersama manta di Karang Makassar, brunch di kapal, tiba kembali di pelabuhan pukul 14.00.',
   'Morning drift with the mantas at Karang Makassar, brunch on board, back at the harbour by 14:00.'),
  ('padar-sunrise-pink-beach-explorer', 0, 'Labuan Bajo → Padar', 'Labuan Bajo → Padar', 'Berlayar sore dan bermalam di dekat Padar.', 'Afternoon sail and a night anchored near Padar.'),
  ('padar-sunrise-pink-beach-explorer', 1, 'Sunrise Padar, Pink Beach, Manta Point', 'Padar sunrise, Pink Beach, Manta Point', '', '')
) as i(slug, sort_order, title_id, title_en, desc_id, desc_en) on i.slug = p.slug;

insert into public.package_images (package_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/teridox-' || slug || '-' || n || '/1200/900', n
from public.packages, generate_series(1, 2) n;
