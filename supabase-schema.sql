-- ============================================================
-- jalaku – Supabase Schema
-- ============================================================

-- ── BAGIAN 1: CLEANUP ────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.reviews  cascade;
drop table if exists public.users    cascade;
drop table if exists public.bookings cascade;
drop table if exists public.orders   cascade;
drop table if exists public.products cascade;

-- ── BAGIAN 2: TABEL UTAMA ────────────────────────────────────

-- ── Tabel: products (Katalog Barang)
create table public.products (
  id              uuid        primary key default gen_random_uuid(),
  nama            text        not null,
  slug            text        not null unique,
  deskripsi       text,
  kategori        text        not null check (kategori in (
                    'gabah','beras','kopi','alpukat','jagung','olahan_dapur'
                  )),
  harga           bigint      not null check (harga > 0), 
  satuan          text        not null default 'kg',
  stok            integer     not null default 0,
  status          text        not null default 'unavailable' check (status in (
                    'ready','unavailable','pre_order'
                  )),
  foto_url        text,
  catatan_musim   text,                                    
  tersedia_mulai  date,                                    
  created_at      timestamptz not null default now()
);

create index idx_products_kategori on public.products (kategori);
create index idx_products_status   on public.products (status);

-- ── Tabel: users (Profil Member)
create table public.users (
  id                uuid        primary key references auth.users on delete cascade,
  email             text        not null unique,
  role              text        not null default 'customer' check (role in ('admin','customer')),
  poin              integer     not null default 0 check (poin >= 0),
  membership_expiry timestamptz default null, 
  created_at        timestamptz not null default now()
);

-- ── Tabel: orders (Transaksi & Nota)
create table public.orders (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references public.users(id) on delete set null, 
  nama_pembeli  text        not null, 
  no_wa         text        not null,
  alamat_kirim  text        not null, -- Menjawab pertanyaan Manus (Disimpan di DB)
  metode_bayar  text        not null check (metode_bayar in ('cod', 'transfer_bank')), -- Mengunci pilihan pembayaran
  catatan       text,
  items         jsonb       not null default '[]'::jsonb,  
  total         bigint      not null check (total >= 0),
  status        text        not null default 'new' check (status in (
                  'new','confirmed','completed','cancelled'
                )),
  created_at    timestamptz not null default now()
);

create index idx_orders_user_id on public.orders (user_id);
create index idx_orders_status  on public.orders (status);

-- ── Tabel: bookings (Sistem Antrean Pre-Order)
create table public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products (id) on delete cascade,
  nama_pembeli  text        not null,
  no_wa         text        not null,
  jumlah_pesan  integer     not null default 1 check (jumlah_pesan > 0),
  catatan       text,
  status        text        not null default 'pending' check (status in (
                  'pending','confirmed','cancelled'
                )),
  created_at    timestamptz not null default now()
);

create index idx_bookings_product_id on public.bookings (product_id);
create index idx_bookings_status     on public.bookings (status);

-- ── Tabel: reviews (Ulasan Produk)
create table public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        not null references public.products (id) on delete cascade,
  user_id     uuid        not null references public.users    (id) on delete cascade,
  rating      integer     not null check (rating >= 1 and rating <= 5),
  komentar    text,
  created_at  timestamptz not null default now(),
  constraint one_review_per_user_per_product unique (user_id, product_id)
);

create index idx_reviews_product_id on public.reviews (product_id);
create index idx_reviews_user_id    on public.reviews (user_id);

-- ── BAGIAN 3: TRIGGER (AUTO-CREATE USER PROFILE) ─────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, poin)
  values (new.id, new.email, 'customer', 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── BAGIAN 4: ROW LEVEL SECURITY (RLS) - PERBAIKAN ───────────
alter table public.products  enable row level security;
alter table public.orders    enable row level security;
alter table public.users     enable row level security;
alter table public.reviews   enable row level security;
alter table public.bookings enable row level security;

create policy "products_select_public" on public.products for select using (true);
create policy "reviews_select_public"  on public.reviews for select using (trQue);
create policy "users_select_self"      on public.users for select using ((select auth.uid()) = id);

-- ── BAGIAN 5: DATA DUMMY PRODUK ──────────────────────────────
insert into public.products
  (nama, slug, deskripsi, kategori, harga, satuan, stok, status, catatan_musim, foto_url)
values
  (
    'Beras Pandan Wangi Cianjur', 'beras-pandan-wangi',
    'Beras kualitas super dengan aroma pandan alami. Tanpa pemutih, tanpa pengawet. Nasi tetap pulen meski sudah dingin.',
    'beras', 18000, 'kg', 100, 'ready', 'Panen Raya: Maret & April', 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
  ),
  (
    'Kopi Robusta Temanggung (Fine Robusta)', 'kopi-robust-temanggung',
    'Kopi dengan body tebal dan notes cokelat kacang yang kuat. Cocok untuk pecinta kopi tubruk atau susu.',
    'kopi', 95000, '500g', 45, 'ready', 'Musim Petik: Juni - Agustus', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e'
  ),
  (
    'Alpukat Mentega Super (Grade A)', 'alpukat-mentega-super',
    'Daging tebal, warna kuning mentega, dan tekstur sangat creamy. Berat rata-rata 400-600g per buah.',
    'alpukat', 35000, 'kg', 0, 'pre_order', 'Tersedia kembali: September', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578'
  ),
  (
    'Sambal Bawang "Pedas Nagih" Ibu Sri', 'sambal-bawang-ibu-sri',
    'Dibuat dari cabai rawit pilihan dan bawang merah segar. Tanpa MSG, rasa pedasnya bikin nambah nasi terus!',
    'olahan_dapur', 35000, 'jar 200g', 20, 'ready', 'Produksi terbatas setiap hari Jumat', 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db'
  ),
  (
    'Jagung Manis Madu', 'jagung-manis-madu',
    'Jagung manis varietas unggul, dipetik pagi hari langsung dikirim. Sangat manis bahkan bisa dimakan mentah.',
    'jagung', 12000, 'kg', 60, 'ready', 'Panen setiap 3 bulan', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076'
  );