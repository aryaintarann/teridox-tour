-- Sample packages. Run after 0001_init.sql. Images are placeholders (picsum), replace from the admin panel.
with p as (
  insert into public.packages
    (slug, category, title_id, title_en, description_id, description_en,
     includes_id, includes_en, excludes_id, excludes_en,
     duration_hours, price, capacity, max_participants, cover_image_url)
  values
    ('ubud-full-day', 'tour', 'Ubud Seharian', 'Ubud Full Day',
     'Sawah Tegallalang, Monkey Forest, dan Pasar Seni Ubud dengan sopir berpengalaman.',
     'Tegallalang rice terraces, Monkey Forest and Ubud Art Market with an experienced driver.',
     '{"Mobil + sopir","BBM","Air mineral"}', '{"Car + driver","Fuel","Mineral water"}',
     '{"Tiket masuk","Makan siang"}', '{"Entrance tickets","Lunch"}',
     10, 850000, 3, 6, 'https://picsum.photos/seed/teridox-ubud/1600/1000'),
    ('kintamani-sunrise', 'tour', 'Sunrise Kintamani', 'Kintamani Sunrise',
     'Berangkat dini hari menuju Gunung Batur, sarapan dengan pemandangan danau.',
     'Pre-dawn drive to Mount Batur and breakfast overlooking the lake.',
     '{"Mobil + sopir","BBM","Sarapan"}', '{"Car + driver","Fuel","Breakfast"}',
     '{"Jeep offroad"}', '{"Offroad jeep"}',
     8, 950000, 2, 6, 'https://picsum.photos/seed/teridox-kintamani/1600/1000'),
    ('uluwatu-sunset', 'tour', 'Sunset Uluwatu & Tari Kecak', 'Uluwatu Sunset & Kecak Dance',
     'Pantai Padang Padang, Pura Uluwatu, dan pertunjukan Kecak saat matahari terbenam.',
     'Padang Padang beach, Uluwatu Temple and the Kecak fire dance at sunset.',
     '{"Mobil + sopir","BBM"}', '{"Car + driver","Fuel"}',
     '{"Tiket Kecak","Makan malam"}', '{"Kecak ticket","Dinner"}',
     8, 800000, 3, 6, 'https://picsum.photos/seed/teridox-uluwatu/1600/1000'),
    ('airport-transfer', 'transfer', 'Antar Jemput Bandara', 'Airport Transfer',
     'Penjemputan dari Bandara Ngurah Rai ke hotel Anda di area Bali Selatan.',
     'Pickup from Ngurah Rai Airport to your hotel in South Bali.',
     '{"Mobil + sopir","BBM","Parkir bandara"}', '{"Car + driver","Fuel","Airport parking"}',
     '{}', '{}',
     2, 300000, 5, 6, 'https://picsum.photos/seed/teridox-airport/1600/1000'),
    ('car-rental-12h', 'rental', 'Sewa Mobil + Sopir 12 Jam', 'Car + Driver 12 Hours',
     'Atur sendiri rute Anda. Sopir mengikuti jadwal Anda selama 12 jam.',
     'Plan your own route. The driver follows your schedule for 12 hours.',
     '{"Mobil + sopir","BBM"}', '{"Car + driver","Fuel"}',
     '{"Tiket masuk","Makan sopir"}', '{"Entrance tickets","Driver meals"}',
     12, 750000, 4, 6, 'https://picsum.photos/seed/teridox-rental/1600/1000')
  returning id, slug
)
insert into public.package_itinerary (package_id, sort_order, time_label, title_id, title_en, desc_id, desc_en)
select p.id, i.sort_order, i.time_label, i.title_id, i.title_en, i.desc_id, i.desc_en
from p join (values
  ('ubud-full-day', 1, '08:00', 'Jemput di hotel', 'Hotel pickup', '', ''),
  ('ubud-full-day', 2, '09:30', 'Sawah Tegallalang', 'Tegallalang rice terraces', 'Jalan santai di terasering.', 'Easy walk along the terraces.'),
  ('ubud-full-day', 3, '12:00', 'Monkey Forest', 'Monkey Forest', '', ''),
  ('ubud-full-day', 4, '15:00', 'Pasar Seni Ubud', 'Ubud Art Market', '', ''),
  ('kintamani-sunrise', 1, '03:30', 'Jemput di hotel', 'Hotel pickup', '', ''),
  ('kintamani-sunrise', 2, '06:00', 'Sunrise Gunung Batur', 'Mount Batur sunrise', '', ''),
  ('kintamani-sunrise', 3, '08:00', 'Sarapan di Kintamani', 'Breakfast in Kintamani', '', ''),
  ('uluwatu-sunset', 1, '13:00', 'Jemput di hotel', 'Hotel pickup', '', ''),
  ('uluwatu-sunset', 2, '14:30', 'Pantai Padang Padang', 'Padang Padang beach', '', ''),
  ('uluwatu-sunset', 3, '18:00', 'Tari Kecak di Uluwatu', 'Kecak dance at Uluwatu', '', '')
) as i(slug, sort_order, time_label, title_id, title_en, desc_id, desc_en) on i.slug = p.slug;

insert into public.package_images (package_id, image_url, sort_order)
select id, 'https://picsum.photos/seed/teridox-' || slug || '-' || n || '/1200/900', n
from public.packages, generate_series(1, 3) n;
