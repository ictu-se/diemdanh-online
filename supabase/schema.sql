create extension if not exists "pgcrypto";

create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organization_name text not null default '',
  email text not null,
  phone_number text not null unique,
  is_present boolean not null default false,
  checked_in_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.attendees
add column if not exists organization_name text not null default '';

alter table public.attendees enable row level security;

drop policy if exists "Public can read attendees" on public.attendees;
drop policy if exists "No direct browser writes" on public.attendees;

create policy "Public can read attendees"
on public.attendees
for select
to anon, authenticated
using (true);

create policy "No direct browser writes"
on public.attendees
for all
to anon, authenticated
using (false)
with check (false);

insert into public.attendees (full_name, organization_name, email, phone_number, is_present, checked_in_at)
values
  ('Nguyen Van An', 'Phong Cong tac sinh vien', 'an.nguyen01@example.com', '0901000001', true, now() - interval '90 minutes'),
  ('Tran Thi Bich', 'Khoa Cong nghe thong tin', 'bich.tran02@example.com', '0901000002', false, null),
  ('Le Quang Huy', 'Trung tam Hoc lieu', 'huy.le03@example.com', '0901000003', true, now() - interval '75 minutes'),
  ('Pham Gia Bao', 'Phong Dao tao', 'bao.pham04@example.com', '0901000004', false, null),
  ('Do Minh Chau', 'Khoa Ky thuat phan mem', 'chau.do05@example.com', '0901000005', false, null),
  ('Vo Thanh Dat', 'Phong Khao thi', 'dat.vo06@example.com', '0901000006', true, now() - interval '60 minutes'),
  ('Bui Ngoc Diep', 'Khoa Mang may tinh', 'diep.bui07@example.com', '0901000007', false, null),
  ('Hoang Khanh Linh', 'Phong Hanh chinh', 'linh.hoang08@example.com', '0901000008', false, null),
  ('Dang Tuan Kiet', 'Khoa He thong thong tin', 'kiet.dang09@example.com', '0901000009', true, now() - interval '52 minutes'),
  ('Phan Thu Ha', 'Phong Tai chinh', 'ha.phan10@example.com', '0901000010', false, null),
  ('Ngo Duc Manh', 'Van phong Doan thanh nien', 'manh.ngo11@example.com', '0901000011', false, null),
  ('Duong Bao Nhi', 'Thu vien truong', 'nhi.duong12@example.com', '0901000012', true, now() - interval '45 minutes'),
  ('Ly Anh Thu', 'Khoa Khoa hoc may tinh', 'thu.ly13@example.com', '0901000013', false, null),
  ('Cao Hoai Nam', 'Phong Quan tri thiet bi', 'nam.cao14@example.com', '0901000014', false, null),
  ('Truong My Duyen', 'Khoa Truyen thong da phuong tien', 'duyen.truong15@example.com', '0901000015', true, now() - interval '35 minutes'),
  ('Mai Tien Phuc', 'Phong Cong tac quoc te', 'phuc.mai16@example.com', '0901000016', false, null),
  ('Ta Bao Tram', 'Phong Thanh tra', 'tram.ta17@example.com', '0901000017', false, null),
  ('Nguyen Huu Khang', 'Trung tam Chuyen doi so', 'khang.nguyen18@example.com', '0901000018', true, now() - interval '28 minutes'),
  ('Tran Gia Linh', 'Khoa Thuong mai dien tu', 'linh.tran19@example.com', '0901000019', false, null),
  ('Le Minh Tam', 'Phong Cong nghe va Dam bao chat luong', 'tam.le20@example.com', '0901000020', false, null)
on conflict (phone_number) do nothing;
