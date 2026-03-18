# DiemDanh Online

Ung dung diem danh online free voi Next.js + Supabase + Vercel.

## Thu muc

- `src/app`: giao dien va routes
- `src/lib`: Supabase helpers, auth admin, logic diem danh
- `supabase/schema.sql`: tao bang, policy va seed mau
- `.env.example`: bien moi truong can thiet

## Setup local

1. Copy `.env.example` thanh `.env.local`
2. Tao project Supabase
3. Chay `supabase/schema.sql` trong SQL Editor
4. Dien cac key Supabase vao `.env.local`
5. Chay:

```bash
npm install
npm run dev
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSCODE=123456
```

## Deploy free

1. Day folder nay len GitHub
2. Import repository vao Vercel
3. Them 4 environment variables
4. Deploy

## Routes

- `/`: trang cong khai diem danh
- `/admin/login`: dang nhap admin bang passcode
- `/admin`: CRUD danh sach
- `/setup`: huong dan setup nhanh
