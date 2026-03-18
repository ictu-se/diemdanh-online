import Link from "next/link";

export default function SetupPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">DiemDanh Online</div>
        <nav className="nav">
          <Link href="/">Điểm danh</Link>
          <Link href="/admin">Quản trị</Link>
          <Link href="/admin/manage">Quản lý dữ liệu</Link>
        </nav>
      </header>

      <section className="panel content-panel stack">
        <h1 className="section-title">Hướng dẫn setup nhanh</h1>
        <p className="muted">
          Bạn tạo project Supabase, chạy file SQL trong thư mục `supabase`, sau đó thêm environment variables trên Vercel.
        </p>

        <div className="details">
          <div>
            <strong>1. Tạo bảng và seed</strong>
            <p className="muted">Mở SQL Editor trong Supabase và chạy file `supabase/schema.sql`.</p>
          </div>
          <div>
            <strong>2. Đặt environment variables</strong>
            <code className="helper-code">
              NEXT_PUBLIC_SUPABASE_URL=...{"\n"}
              NEXT_PUBLIC_SUPABASE_ANON_KEY=...{"\n"}
              SUPABASE_SERVICE_ROLE_KEY=...{"\n"}
              ADMIN_PASSCODE=...
            </code>
          </div>
          <div>
            <strong>3. Deploy lên Vercel</strong>
            <p className="muted">Import project này vào Vercel, thêm 4 biến môi trường, và deploy là có link online.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
